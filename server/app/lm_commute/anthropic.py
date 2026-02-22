import os
from typing import List, Dict
import anthropic
from anthropic import Anthropic
from anthropic.types import MessageParam, TextBlock, ImageBlockParam

from app.schema import LLMMessage

client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY", "")
)

def get_anthropic_client(api_key: str) -> Anthropic:
    """
    Get the Anthropic client instance.
    """
    client = Anthropic(api_key=api_key)
    return client

def anthropic_chat(messages: List[LLMMessage], model: str, api_key: str, max_tokens: int=4096, temperature: float=0.8) -> str:
    """
    Generate code using Anthropic's API based on the provided messages and model.
    """
    anthropic_client = get_anthropic_client(api_key=api_key)
    instruction = ""
    try:
        # check the validity of the messages
        code_messages = []
        for msg in messages:
            if msg.is_multimodal:
                content_parts = []
                
                if msg.content:
                    content_parts.append({"type": "text", "text": msg.content})
                
                if msg.image_url:
                    if msg.image_url.startswith("data:image"):
                        media_type, base64_data = msg.image_url.split(";base64,")
                        media_type = media_type.replace("data:", "")
                        content_parts.append({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64_data
                            }
                        })
                
                if msg.role == "user":
                    code_messages.append(MessageParam(role="user", content=content_parts))
                elif msg.role == "assistant":
                    code_messages.append(MessageParam(role="assistant", content=msg.content or ""))
                elif msg.role == "system":
                    instruction = (msg.content or "").strip()
            else:
                if msg.role == "user":
                    code_messages.append(MessageParam(role="user", content=msg.content))
                elif msg.role == "assistant":
                    code_messages.append(MessageParam(role="assistant", content=msg.content))
                elif msg.role == "system":
                    instruction = msg.content.strip()
                else:
                    raise ValueError(f"Invalid message role: {msg.role}")
    except Exception as e:
        raise ValueError(f"Invalid message format: {e}")
    
    llm_response = anthropic_client.messages.create(
        model=model,
        system=instruction,
        messages=code_messages, 
        max_tokens=max_tokens,
        temperature=temperature, 
    )

    if not llm_response.content or len(llm_response.content) == 0:
        raise ValueError("The response from Anthropic is empty. Please check the input messages or the model.")
    else:
        if isinstance(llm_response.content, list):
            # If the response is a list, take the first element
            content = llm_response.content[0]
            if isinstance(content, TextBlock):
                llm_result = content.text
            else:
                raise ValueError("Unexpected response format from Anthropic API. {}".format(llm_response.content))
        else:
            # If the response is a single string, use it directly
            if hasattr(llm_response.content, 'value'):
                llm_result = llm_response.content.value
            else:
                raise ValueError("Unexpected response format from Anthropic API. {}".format(llm_response.content))

    return llm_result
