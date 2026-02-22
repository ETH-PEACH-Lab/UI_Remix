import os
from typing import List, Dict
import openai
from openai import OpenAI
from openai.types.chat import ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionSystemMessageParam

from app.schema import LLMMessage
from app.logger_config import get_logger, log_info, log_error, log_warning

logger = get_logger()

openai.api_key = os.environ.get("OPENAI_API_KEY")


def get_openai_client(api_key: str) -> OpenAI:
    """
    Get the OpenAI client instance.
    """
    client = OpenAI(api_key=api_key)
    return client

def openai_chat(messages: List[LLMMessage], model: str, api_key: str) -> str:
    """
    Generate code using OpenAI's API based on the provided messages and model.
    """
    log_info(f"🔵 [OpenAI] Starting OpenAI API call - model: {model}")
    
    openai_client = get_openai_client(api_key)
    try:
        # check the validity of the messages
        code_messages = []
        for msg in messages:
            if msg.is_multimodal:
                content_parts = []
                
                if msg.content:
                    content_parts.append({
                        "type": "text",
                        "text": msg.content
                    })
                
                if msg.image_url:
                    content_parts.append({
                        "type": "input_image", 
                        "image_url": msg.image_url, 
                    })
                
                if msg.role == "user":
                    code_messages.append(ChatCompletionUserMessageParam(content=content_parts, role=msg.role))
                elif msg.role == "assistant":
                    code_messages.append(ChatCompletionAssistantMessageParam(role=msg.role, content=msg.content or ""))
                elif msg.role == "developer":
                    code_messages.append(ChatCompletionSystemMessageParam(role=msg.role, content=msg.content or ""))
                else:
                    raise ValueError(f"Invalid message role: {msg.role}")
            else:
                if msg.role == "user":
                    code_messages.append(ChatCompletionUserMessageParam(content=msg.content, role=msg.role))
                elif msg.role == "assistant":
                    code_messages.append(ChatCompletionAssistantMessageParam(role=msg.role, content=msg.content))
                elif msg.role == "developer":
                    code_messages.append(ChatCompletionSystemMessageParam(role=msg.role, content=msg.content))
                else:
                    raise ValueError(f"Invalid message role: {msg.role}")
    except Exception as e:
        log_error(f"❌ [OpenAI] Invalid message format: {e}")
        raise ValueError(f"Invalid message format: {e}")
    
    try:
        log_info("🔄 [OpenAI] Sending request to OpenAI API...")
        params = {
            "model": model,
            "input": code_messages, 
        }
        if model == "gpt-5":
            params["reasoning"] = {
                "effort": "minimal"
            }

        llm_response = openai_client.responses.create(**params)
        
        llm_result = llm_response.output_text
        log_info(f"✅ [OpenAI] API call succeeded, response length: {len(llm_result) if llm_result else 0} characters")
        
    except openai.AuthenticationError as e:
        log_error(f"🔑 [OpenAI] Authentication error - invalid/expired API key: {e}")
        print("\n❌ OpenAI API authentication failed:")
        print(f"   Details: {e}")
        print("   Please check whether your API key is correct")
        raise ValueError(f"OpenAI API authentication failed: {e}")
        
    except openai.RateLimitError as e:
        log_error(f"🚫 [OpenAI] Rate limit error: {e}")
        print("\n⚠️  OpenAI API rate limited:")
        print(f"   Details: {e}")
        print("   Please retry later or check your quota/usage")
        raise ValueError(f"OpenAI API rate limited: {e}")
        
    except openai.APIConnectionError as e:
        log_error(f"🌐 [OpenAI] Network error - cannot reach OpenAI servers: {e}")
        print("\n🌐 OpenAI API connection failed:")
        print(f"   Details: {e}")
        print("   Please check your network connection or retry later")
        raise ValueError(f"OpenAI API connection failed: {e}")
        
    except openai.APITimeoutError as e:
        log_error(f"⏰ [OpenAI] Request timed out: {e}")
        print("\n⏰ OpenAI API timeout:")
        print(f"   Details: {e}")
        print("   Please retry later")
        raise ValueError(f"OpenAI API timeout: {e}")
        
    except openai.BadRequestError as e:
        log_error(f"📝 [OpenAI] Bad request - invalid parameters: {e}")
        print("\n📝 OpenAI API request error:")
        print(f"   Details: {e}")
        print("   Please check the model name and request parameters")
        raise ValueError(f"OpenAI API request error: {e}")
        
    except openai.InternalServerError as e:
        log_error(f"🔧 [OpenAI] Server error - OpenAI service unavailable: {e}")
        print("\n🔧 OpenAI server error:")
        print(f"   Details: {e}")
        print("   OpenAI service may be temporarily unavailable; please retry later")
        raise ValueError(f"OpenAI server error: {e}")
        
    except Exception as e:
        log_error(f"❌ [OpenAI] Unknown error: {e}")
        print("\n❌ OpenAI API call failed with an unknown error:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Details: {e}")
        raise ValueError(f"OpenAI API call failed: {e}")

    if not llm_result:
        log_warning("⚠️  [OpenAI] API returned an empty response")
        print("\n⚠️  OpenAI API returned an empty response")
        print("   Please check the input messages or model settings")
        raise ValueError("The response from OpenAI is empty. Please check the input messages or the model.")

    return llm_result