import re
import difflib
from unidiff import PatchSet, UnidiffParseError
import json
from arrow import get
from fastapi import Request, HTTPException
from typing import List, Dict, Any, Optional, Tuple
import os
from lxml import html, etree
from PIL import Image
import io
import base64

from app.tools import purify_llm_generted_html_code
from app.configs import get_config
from app.schema import (
    APIKeys,
    ChatMessage,
    GenerationResponse,
    GlobalWeb,
    LLMMessage,
    SpecificWeb,
    WorkPlaceItem,
    FileData,
)
from app.file_handler import get_file_contents
from app.generation.prompts import get_generate_instruction, get_generate_prompt, get_tag_instruction, get_tag_prompt
from app.lm_commute.openai import openai_chat
from app.lm_commute.anthropic import anthropic_chat


def process_message_code(llm_generation: str) -> Tuple[str | None, str | None]:
    llm_generations = llm_generation.split("\n", 1)
    if len(llm_generations) == 2:
        chat_result = llm_generations[0].strip()
        code_result = purify_llm_generted_html_code(llm_generations[1])
        return chat_result, code_result
    else:
        chat_result = llm_generations[0].strip()
        code_result = None
        return chat_result, code_result

def generate_code(instruction: str, prompt: str, model: str, api_keys: APIKeys) -> str:
    # handle code generation
    code_messages = [
        LLMMessage(role="developer", content=instruction),  # Instruction
        LLMMessage(role="user", content=prompt),  # Prompt
    ]
    config = get_config()
    if model in config.openai_models:
        code_result = openai_chat(code_messages, model, api_keys.openai)
    elif model in config.anthropic_models:
        code_result = anthropic_chat(code_messages, model, api_keys.anthropic)
    else:
        raise ValueError(f"Unsupported model: {model}")
    code_result = code_result.strip()
    return code_result

def normalize_diff(text: str, fromfile="a.txt", tofile="b.txt") -> str:
    s = text.strip()
    s = re.sub(r"^```(?:diff|patch)?\s*\n?", "", s, flags=re.I)
    s = re.sub(r"\n?```$", "", s)
    s = re.sub(r'(?m)^index [0-9a-f]{7,}\.\.[0-9a-f]{7,}(?: \d{6})?\s*$', '', s)
    s = s.replace("\r\n", "\n").replace("\r", "\n").strip("\n")
    has_from = re.search(r'(?m)^---\s+', s) is not None
    has_to   = re.search(r'(?m)^\+\+\+\s+', s) is not None
    if not has_from or not has_to:
        head = []
        if not has_from: head.append(f"--- {fromfile}")
        if not has_to:   head.append(f"+++ {tofile}")
        s = "\n".join(head + [s])
    if not s.endswith("\n"): s += "\n"
    return s

_HUNK_RE = re.compile(r'^@@\s*-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s*@@(.*)$')

def fix_hunk_lengths(diff_text: str) -> str:
    s = diff_text.replace("\r\n", "\n").replace("\r", "\n")
    if not s.endswith("\n"):
        s += "\n"
    lines = s.split("\n")
    out, i, n = [], 0, len(lines) - 1
    def is_header(l): return l.startswith('--- ') or l.startswith('+++ ') or l.startswith('diff --git ')
    while i < n:
        line = lines[i]
        m = _HUNK_RE.match(line)
        if not m:
            if re.match(r'^index [0-9a-f]{7,}\.\.[0-9a-f]{7,}(?: \d{6})?$', line):
                i += 1; continue
            out.append(line); i += 1; continue
        header_pos = len(out); out.append(line); i += 1
        src_cnt = tgt_cnt = 0
        while i < n:
            l = lines[i]
            if _HUNK_RE.match(l) or is_header(l):
                break
            if l.startswith(r'\ No newline at end of file'):
                out.append(l); i += 1; continue
            if   l.startswith(' '): src_cnt += 1; tgt_cnt += 1
            elif l.startswith('-'): src_cnt += 1
            elif l.startswith('+'): tgt_cnt += 1
            else:                   src_cnt += 1; tgt_cnt += 1
            out.append(l); i += 1
        new_header = f"@@ -{m.group(1)},{src_cnt} +{m.group(3)},{tgt_cnt} @@{m.group(5)}"
        out[header_pos] = new_header
    return "\n".join(out) + "\n"

def _build_source_pattern(hunk) -> List[str]:
    pat = []
    for line in hunk:
        val = getattr(line, "value", "")
        if val.startswith(r'\ No newline at end of file'):
            continue
        if line.is_context or line.is_removed:
            pat.append(val)
    return pat

def _apply_hunk_at(old_lines: List[str], hunk, start_idx: int) -> List[str]:
    j = start_idx
    out = old_lines[:j]
    for line in hunk:
        val = getattr(line, "value", "")
        if val.startswith(r'\ No newline at end of file'):
            continue
        if line.is_context:
            out.append(old_lines[j]); j += 1
        elif line.is_removed:
            j += 1
        elif line.is_added:
            out.append(val)
    out.extend(old_lines[j:])
    return out

def _find_exact(old_lines: List[str], pattern: List[str], center: int, window: int = 200):
    if not pattern:
        return max(0, min(center, len(old_lines)))
    n = len(pattern); lo = max(0, center - window); hi = min(len(old_lines) - n, center + window)
    for i in range(lo, hi + 1):
        if old_lines[i:i+n] == pattern:
            return i
    for i in range(0, len(old_lines) - n + 1):
        if old_lines[i:i+n] == pattern:
            return i
    return -1

def _find_fuzzy(old_lines: List[str], pattern: List[str], center: int, window: int = 200, threshold: float = 0.72):
    if not pattern:
        return max(0, min(center, len(old_lines)))
    target = "".join(pattern)
    n = len(pattern)
    best = (-1, 0.0)
    lo = max(0, center - window); hi = min(len(old_lines) - n, center + window)
    for i in range(lo, hi + 1):
        cand = "".join(old_lines[i:i+n])
        r = difflib.SequenceMatcher(None, cand, target).ratio()
        if r > best[1]:
            best = (i, r)
    return best[0] if best[1] >= threshold else -1

def apply_unified_diff_fuzzy(old_text: str, diff_text: str) -> str:
    diff_text = normalize_diff(diff_text)
    diff_text = fix_hunk_lengths(diff_text)
    old_lines = old_text.splitlines(True)
    patch = PatchSet(diff_text.splitlines(True))
    if not patch:
        return old_text

    pfile = next(iter(patch))

    for hunk in pfile:
        pattern = _build_source_pattern(hunk)
        predicted = max(0, getattr(hunk, "source_start", 1) - 1)
        idx = _find_exact(old_lines, pattern, predicted)
        if idx < 0:
            idx = _find_fuzzy(old_lines, pattern, predicted)
        if idx < 0:
            continue
            raise RuntimeError(
                "Failed to locate the hunk in the old text; consider increasing context (e.g. -U3/-U5) or relaxing the threshold."
            )
        old_lines = _apply_hunk_at(old_lines, hunk, idx)

    return "".join(old_lines)

def generate_code_messages(messages: List[LLMMessage], model: str, api_keys: APIKeys) -> str:
    # handle code generation with messages
    config = get_config()
    if model in config.openai_models:
        code_result = openai_chat(messages, model, api_keys.openai)
    elif model in config.anthropic_models:
        code_result = anthropic_chat(messages, model, api_keys.anthropic)
    else:
        raise ValueError(f"Unsupported model: {model}")
    code_result = code_result.strip()
    return code_result

def generate_chat_code(
    messages: List[LLMMessage], model: str, api_keys: APIKeys
) -> Tuple[str | None, str | None]:
    #
    """
    handle chat generation and code generation, llm format:
    chat message
    code
    """
    config = get_config()
    if model in config.openai_models:
        llm_result = openai_chat(messages, model, api_keys.openai)
    elif model in config.anthropic_models:
        llm_result = anthropic_chat(messages, model, api_keys.anthropic)
    else:
        raise ValueError(f"Unsupported model: {model}")

    llm_result = llm_result.strip()
    chat_result, code_result = process_message_code(llm_result)
    return chat_result, code_result

async def get_data_from_from(
    request: Request,
) -> Tuple[
    str,
    str,
    List[ChatMessage],
    str,
    List[GlobalWeb],
    List[SpecificWeb],
    List[FileData],
    Optional[Image.Image],
    APIKeys,
]:
    """Extract request payload from form data."""
    form = await request.form()

    # get code
    code = str(form.get("code"))

    # get chat history
    chat_history = str(form.get("chatHistory"))
    try:
        chat_history = [ChatMessage(**msg) for msg in json.loads(chat_history)]
    except json.JSONDecodeError:
        chat_history = []
        raise HTTPException(400, "chat_history: invalid JSON")
    except Exception as e:
        chat_history = []
        raise HTTPException(400, f"Failed to parse chat history: {str(e)}")

    # get model name
    model = str(form.get("model"))
    config = get_config()
    valid_models = config.openai_models + config.anthropic_models
    if model not in valid_models:
        raise HTTPException(
            400, f"Invalid model name: {model}. Available models: {', '.join(valid_models)}"
        )

    # get global and specific webs
    global_webs = str(form.get("globalWebs"))
    global_webs = json.loads(global_webs) if global_webs else []
    global_webs = [GlobalWeb(**web) for web in global_webs]
    specific_webs = str(form.get("specificWebs"))
    specific_webs = json.loads(specific_webs) if specific_webs else []
    specific_webs = [SpecificWeb(**web) for web in specific_webs]
    target_tag = str(form.get("targetTag"))

    # get
    api_keys = APIKeys(
        openai=os.getenv('OPENAI_API_KEY'),
    )

    files = await get_file_contents(request)

    screenshot = None
    if "drawingImage" in form:
        drawing_file = form["drawingImage"]
        if drawing_file and hasattr(drawing_file, 'read'):
            drawing_content = await drawing_file.read()
            
            try:
                screenshot = Image.open(io.BytesIO(drawing_content))
                if screenshot.mode != 'RGB':
                    screenshot = screenshot.convert('RGB')
                
            except Exception as e:
                print(f"❌ Failed to create image object: {e}")
                screenshot = None

    return (
        code,
        target_tag, 
        chat_history,
        model,
        global_webs,
        specific_webs,
        files,
        screenshot,
        api_keys,
    )

def get_target_tag_code(code: str, target_tag: str) -> str:
    """
    Get the target tag code from the code.
    """
    tree = html.fromstring(code)
    result = tree.xpath(target_tag)
    if len(result) > 0:
        node = result[0]
        node_code = etree.tostring(node, pretty_print=True).decode('utf-8')
        return node_code
    else:
        return "Empty"

def encode_image(image: Image.Image) -> str:
    """
    Encode the image to base64.
    """
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"

async def handle_generate_request(request: Request) -> GenerationResponse:
    """
    Get the workplace code from OpenAI based on the provided messages and model.
    """
    (
        code,
        target_tag, 
        chat_history,
        model,
        global_webs,
        specific_webs,
        files,
        screenshot,
        api_keys,
    ) = await get_data_from_from(request)

    screenshot_url = encode_image(screenshot)

    if target_tag != "global":
        print("start generate")
        instruction = get_tag_instruction()
        target_tag_code = get_target_tag_code(code, target_tag)
        target_tag_and_code = [target_tag, target_tag_code]
        prompt = get_tag_prompt(code, chat_history, target_tag_and_code)
        messages = [
            LLMMessage(role="developer", content=instruction),
            LLMMessage(role="user", content=prompt),
            LLMMessage(role="user", image_url=screenshot_url)
        ]
        code_result = generate_code_messages(messages, model, api_keys)
        print(code_result)
        code_result = apply_unified_diff_fuzzy(code, code_result)
    else:
        instruction = get_generate_instruction()
        target_tag_and_code = [target_tag, None]
        prompt = get_generate_prompt(code, chat_history, target_tag_and_code)
        # generate new code according to the chat history
        messages = [
            LLMMessage(role="developer", content=instruction),
            LLMMessage(role="user", content=prompt), 
            LLMMessage(role="user", image_url=screenshot_url)
        ]
        code_result = generate_code_messages(messages, model, api_keys)
    
    chat_response = """I have generated the code according to the request. Please check the new UI in the right."""

    chat_history.append(
        ChatMessage(
            messageId=chat_history[-1].messageId + 1,
            sender="assistant",
            content=chat_response,
            type="message",
            style="generate", 
        )
    )

    return GenerationResponse(
        newChatHistory=chat_history,
        code=code_result,
        retrievalQuery="",
        globalWebs=global_webs,
        specificWebs=specific_webs,
    )
