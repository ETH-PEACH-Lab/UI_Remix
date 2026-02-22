from typing import List, Dict

from app.schema import ChatMessage


def get_chat_history_str(chat_history: List[ChatMessage]) -> str:
    """Convert chat history into a single formatted string."""
    chat_history_str = "\n".join([f"{msg.sender}: {msg.content}" for msg in chat_history])
    return chat_history_str