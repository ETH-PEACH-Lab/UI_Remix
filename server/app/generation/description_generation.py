
from typing import List, Dict, Any, Optional

from app.generation.box_generation import PROMPT_TEMPLATE
from app.schema import APIKeys, LLMMessage
from app.lm_commute.openai import openai_chat

INSTRUCTION = """
You are a helpful assistant. You are a part of a RAG system. You are responsible for generating response to users' query. You should give a short description of the UI page based on the given metadata.

There are some additional requirements;
- You should mention the title of the application and the genre of the application.
- You should generate ** around the title of the application: like '**Uber Eat**'
- You should generate the summary in a concise and coherent manner.
- The length of the summary should be less than 50 words.

Example:
Here's a clean, responsive restaurant app homepage. This design is inspired by **Uber Eat**, which is a popular app rated 4.5/5 on the app market.
"""

PROMPT_TEMPLATE = """
Please generate the text according to the information below:
UI info:
{}

Meta info:
{}

Chat History:
{}
"""


def generate_description(ui_info: Dict, metadata: Dict[str, str], chat_history: str, api_keys:APIKeys) -> str:
    """
    Generate the detailed summary by GPT
    """
    ui_info_str = str(ui_info)

    meta_info_str = "Meta Info:\n"
    for k, v in metadata.items():
        meta_info_str += f"{k}: {v}\n"
    
    messages = [
        LLMMessage(
            role="developer",
            content=INSTRUCTION,
        ),
        LLMMessage(
            role="user",
            content=PROMPT_TEMPLATE.format(ui_info_str, meta_info_str, chat_history),
        ),
    ]

    llm_result = openai_chat(messages, model="o3-mini", api_key=api_keys.openai)
    result = llm_result.strip()
    return result

# def generate_description(description: Dict, metadata: Dict[str, str], chat_history: str, api_keys:APIKeys) -> str:
#     """
#     only output the information
#     """
#     web_background = "Background:  " + description.get("background", "")
#     web_content = "Content:  " + description.get("content", "")
#     result = ""

#     return web_background + "\n\n" + web_content
