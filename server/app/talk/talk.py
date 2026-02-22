from ast import Tuple
import os
from fastapi import Request, HTTPException
from typing import List, Dict, Any, Optional, Tuple
import json

from app.configs import get_config
from app.schema import (
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
from app.retrieval.clip_retrieve import global_retrieve
from app.generation.query_generation import generate_retrieval_query
from app.generation.code_generation import generate_code, generate_chat_code
from app.logger_config import get_logger
from app.generation.code_generation import apply_unified_diff_fuzzy


logger = get_logger()

async def get_data_from_from(
    request: Request,
) -> Tuple[
    str,
    List[ChatMessage],
    str,
    List[GlobalWeb],
    List[SpecificWeb],
    List[FileData],
]:
    """Extract request payload from form data."""
    form = await request.form()

    # get code
    code = str(form.get("code"))

    # get chat history
    try:
        chat_history = str(form.get("chatHistory"))
        chat_history = [ChatMessage(**msg) for msg in json.loads(chat_history)]
        
        for msg in chat_history:
            if msg.example is not None:
                logger.info(f"Received message with example: ID={msg.example.id}, Title={msg.example.title}")
                
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
    global_webs = json.loads(global_webs)
    global_webs = [GlobalWeb(**web) for web in global_webs]

    # get specific webs
    specific_webs = str(form.get("specificWebs"))
    specific_webs = json.loads(specific_webs)
    specific_webs = [SpecificWeb(**web) for web in specific_webs]

    files = await get_file_contents(request)

    try:
        if isinstance(global_webs, str):
            global_webs = [GlobalWeb(**web) for web in json.loads(global_webs)]
        if isinstance(specific_webs, str):
            specific_webs = [SpecificWeb(**web) for web in json.loads(specific_webs)]
    except Exception as e:
        print(f"Failed to parse web data: {str(e)}")
        global_webs = []
        specific_webs = []

    return code, chat_history, model, global_webs, specific_webs, files

async def initialize_code_space(
    chat_history: List[ChatMessage],
    model: str,
    files: List[FileData],
    api_keys: APIKeys,
) -> ChatResponse:
    """Initialize the code workspace."""
    config = get_config()
    # get file content
    file_content = "\n".join([file.content for file in files])
    if not file_content:
        file_content = "No files uploaded."

    # handle retrieval query
    retrieval_query = ""
    instruction = get_initial_code_instruction()
    
    messages = [
        LLMMessage(role="developer", content=instruction),
    ]
    for msg in chat_history:
        if msg.type == "message":
            msg = LLMMessage(role=msg.sender, content=msg.content)
            messages.append(msg)

    webpage_description, code_result = generate_chat_code(messages, model, api_keys)
    # update chat history:
    chat_history.append(
        ChatMessage(
            messageId=chat_history[-1].messageId + 1,
            sender="assistant",
            content=f"{webpage_description}",
            type="message",
        )
    )

    return ChatResponse(
        newChatHistory=chat_history,
        code=code_result,
        retrievalQuery=retrieval_query,
        globalWebs=[],
        specificWebs=[],
    )

def standard_chat(
    chat_history: List[ChatMessage],
    model: str,
    files: List[FileData],
    code: str,
    global_webs: List[GlobalWeb],
    specific_webs: List[SpecificWeb],
    api_keys: APIKeys,
) -> ChatResponse:
    """Standard chat handler."""
    instruction = get_chat_instruction(code)
    chat_messages = [
        LLMMessage(role="developer", content=instruction),  # Instruction
    ]
    for msg in chat_history:
        if msg.type == "message":
            chat_messages.append(LLMMessage(role=msg.sender, content=msg.content))

    # get retrieval query
    file_content = "\n".join([file.content for file in files])
    retrieval_query = ""
    # get chat result and new code
    chat_result, code_result = generate_chat_code(chat_messages, model, api_keys)
    if code_result is not None and len(code_result) > 0:
        code_result = apply_unified_diff_fuzzy(code, code_result)
    else:
        code_result = code
    # check the code
    if chat_result is None:
        raise HTTPException(500, "Chat generation failed. Please check the input or model settings.")
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

    return ChatResponse(
        newChatHistory=chat_history,
        code=code_result,
        retrievalQuery=retrieval_query,
        globalWebs=global_webs,
        specificWebs=specific_webs,
    )


async def handle_chat_request(request: Request) -> ChatResponse:
    """Main entrypoint for chat requests."""
    code, chat_history, model, global_webs, specific_webs, files = (
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
        return await initialize_code_space(chat_history, model, files, api_keys)
    else:
        return standard_chat(
            chat_history, model, files, code, global_webs, specific_webs, api_keys
        )
