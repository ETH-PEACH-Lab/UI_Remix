from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional, Union
import base64
import io
from PIL import Image


# main.py
class GlobalWeb(BaseModel):
    id: int
    requirements: str

class SpecificWeb(BaseModel):
    id: int
    part: str
    requirements: str

class WorkPlaceItem(BaseModel):
    workPlaceId: int
    content: str
    reference: int
    target: str
    valid: bool

class ExampleMetadata(BaseModel):
    title: str
    installs: str
    score: str
    reviews: str
    price: int
    genre: str
    developer: str

class ExampleData(BaseModel):
    id: int
    title: str
    metadata: ExampleMetadata

class ChatMessage(BaseModel):
    messageId: int
    sender: str
    content: str
    type: str
    style: Optional[str] = None
    mode: Optional[str] = None
    tag: Optional[str] = None
    example: Optional[ExampleData] = None

class BaselineResponse(BaseModel):
    newChatHistory: List[ChatMessage]
    code: str

class GenerationResponse(BaseModel):
    newChatHistory: List[ChatMessage]
    code: str
    retrievalQuery: str
    globalWebs: List[GlobalWeb]
    specificWebs: List[SpecificWeb]

class ChatResponse(BaseModel):
    newChatHistory: List[ChatMessage]
    code: str
    retrievalQuery: str
    globalWebs: List[GlobalWeb]
    specificWebs: List[SpecificWeb]

# retrieval.py
class GlobalRetrievalResponse(BaseModel):
    retrievalResult: List[str]

class SpecificRetrievalResponse(BaseModel):
    retrievalResult: List[str]
    retrievalBox: List[List[List[int]]]

# llm messages schema

class LLMMessage(BaseModel):
    role: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    
    @property
    def is_multimodal(self) -> bool:
        """Return True if this message contains an image payload."""
        return self.image_url is not None and len(self.image_url) > 0
    
    @classmethod
    def create_text_message(cls, role: str, text: str) -> "LLMMessage":
        """Create a plain text message."""
        return cls(role=role, content=text)
    
    @classmethod
    def create_multimodal_message(cls, role: str, text: str = None, image_url: str = None) -> "LLMMessage":
        """Create a multimodal message (text + image)."""
        return cls(role=role, content=text, image_url=image_url)
    
    @classmethod
    def create_message_with_image(cls, role: str, text: str = None, pil_image: Image.Image = None) -> "LLMMessage":
        """Create a multimodal message from a PIL image."""
        image_url = None
        if pil_image:
            buffer = io.BytesIO()
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            pil_image.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            image_url = f"data:image/png;base64,{img_str}"
        return cls(role=role, content=text, image_url=image_url)

# file handler
class FileData(BaseModel):
    id: str
    name: str
    format: str
    content: str
    metadata: str

# file info from frontend
class FileInfo(BaseModel):
    index: int
    name: str
    type: str

# API keys
class APIKeys(BaseModel):
    openai: str
    anthropic: Optional[str] = None


class UserTrackingData(BaseModel):
    username: str
    session_name: str
    csv_data: str
    workspace_code: Optional[str] = None

class TrackingActionDetails(BaseModel):
    sessionId: str | None = None
    message: str | None = None
    messageMode: str | None = None
    cardId: str | None = None
    cardTitle: str | None = None
    elementXPath: str | None = None
    elementTag: str | None = None
    drawingData: str | None = None
    codeContent: str | None = None
    mode: str | None = None
    previousValue: str | None = None
    newValue: str | None = None
    duration: int | None = None
    coordinates: dict | None = None
    metadata: dict | None = None

class TrackingActionAppend(BaseModel):
    username: str
    session_name: str
    id: str
    timestamp: int
    actionType: str
    userName: str
    details: TrackingActionDetails | None = None
