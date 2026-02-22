from ast import Tuple
import os
from fastapi import Request, HTTPException
from typing import List, Dict, Any, Optional, Tuple
import json

import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.configs import get_config
from app.generation.description_generation import generate_description
from app.schema import (
    BaselineResponse,
    ChatMessage,
    ChatResponse,
    GlobalWeb,
    SpecificWeb,
    FileData,
    APIKeys,
    LLMMessage,
)
from app.file_handler import get_file_contents
from app.talk.prompts import (
    get_initial_code_instruction,
    get_chat_instruction,
)
from app.talk.tools import get_chat_history_str
from app.retrieval.clip_retrieve import global_retrieve
from app.generation.query_generation import generate_retrieval_query
from app.generation.code_generation import generate_code, generate_chat_code, apply_unified_diff_fuzzy
from app.logger_config import get_logger


logger = get_logger()

async def get_data_from_from(
    request: Request,
) -> Tuple[
    str,
    List[ChatMessage],
    str,
]:
    """Extract request payload from form data."""
    form = await request.form()

    # get code
    code = str(form.get("code"))

    # get chat history
    try:
        chat_history = str(form.get("chatHistory"))
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

    return code, chat_history, model

async def initialize_code_space(
    chat_history: List[ChatMessage],
    model: str,
    api_keys: APIKeys,
) -> BaselineResponse:
    """Initialize the code workspace."""
    config = get_config()

    # initialize the code space
    instruction = get_initial_code_instruction(baseline=True)
    
    messages = [
        LLMMessage(role="developer", content=instruction),
    ]
    for msg in chat_history:
        if msg.type == "message":
            messages.append(LLMMessage(role=msg.sender, content=msg.content))

    chat_result, code_result = generate_chat_code(messages, model, api_keys)

    # update chat history:
    chat_history.append(
        ChatMessage(
            messageId=chat_history[-1].messageId + 1,
            sender="assistant",
            content=f"{chat_result}",
            type="message",
        )
    )

    return BaselineResponse(
        newChatHistory=chat_history,
        code=code_result,
    )

def standard_chat(
    chat_history: List[ChatMessage],
    model: str,
    code: str,
    api_keys: APIKeys,
) -> BaselineResponse:
    """Standard chat handler."""
    instruction = get_chat_instruction(code, baseline=True)
    chat_messages = [
        LLMMessage(role="developer", content=instruction),  # Instruction
    ]
    for msg in chat_history:
        if msg.type == "message":
            chat_messages.append(LLMMessage(role=msg.sender, content=msg.content))

    # get chat result and new code
    chat_result, code_result = generate_chat_code(chat_messages, model, api_keys)
    # check the code
    if chat_result is None:
        raise HTTPException(500, "Chat generation failed. Please check the input or model settings.")
    if code_result is not None:
        code_result = apply_unified_diff_fuzzy(code, code_result)
    if code_result is None:
        code_result = code

    chat_history.append(
        ChatMessage(
            messageId=chat_history[-1].messageId + 1,
            sender="assistant",
            content=chat_result,
            type="message",
        )
    )

    return BaselineResponse(
        newChatHistory=chat_history,
        code=code_result,
    )


async def handle_baseline(request: Request) -> BaselineResponse:
    """Main entrypoint for baseline chat requests."""

    code, chat_history, model = (
        await get_data_from_from(request)
    )
    api_keys = APIKeys(
        openai=os.getenv("OPENAI_API_KEY"), 
    )

    sys_chat_num = 0
    for msg in chat_history:
        if msg.sender == "assistant":
            sys_chat_num += 1
        if sys_chat_num > 1:
            break

    if sys_chat_num == 0:
        return await initialize_code_space(chat_history, model, api_keys)
    else:
        return standard_chat(
            chat_history, model, code, api_keys
        )
