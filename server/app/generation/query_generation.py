
from typing import List, Dict, Any, Optional

from app.configs import get_config
from app.schema import APIKeys, ChatMessage, LLMMessage
from app.talk.tools import get_chat_history_str
from app.lm_commute.openai import openai_chat
from app.lm_commute.anthropic import anthropic_chat



def generate_retrieval_query(chat_history: List[ChatMessage], file_content: str, model: str, api_keys: APIKeys) -> str:
    chat_history_str = get_chat_history_str(chat_history)
    retrieval_messages = [
        LLMMessage(role="developer", content="You are a retrieval query assistant of a RAG system for UI design. You will see the chat history between the assistant and the users. What you need to do is to generate the retrieval query which is used to retrieve for the UI pages based on the information provided by the users. You should only generate the retrieval query based on the users' query and uploaded file. You should not add any information not given by user. You should now output anything besides the retrieval query.The example output format is:\na food UI page including images and title."),  # Instruction
        LLMMessage(role="user", content=f"Please provide a retrieval query according to the given chat history.\nchat history: \n{chat_history_str}\nusres' uploaded files: \n{file_content}\nPlease provide a retrieval query according to the given chat history."),
    ]

    configs = get_config()
    if model in configs.openai_models:
        llm_result = openai_chat(retrieval_messages, model, api_key=api_keys.openai)
    elif model in configs.anthropic_models:
        llm_result = anthropic_chat(retrieval_messages, model, api_key=api_keys.anthropic)
    else:
        raise ValueError("Unsupported model: {}".format(model))
    retrieval_query = llm_result
    retrieval_query = retrieval_query.strip().strip('"').strip("'")
    return retrieval_query