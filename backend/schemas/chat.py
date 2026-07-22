from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's message to the AI")
    session_id: str = Field(..., description="Unique session ID to track chat memory")
    topic_id: Optional[str] = Field(None, description="Optional topic ID if the chat is categorized")
    mode: str = Field("guideline", description="The mode to use for the AI response (guideline or research)")

class ChatResponse(BaseModel):
    content: str = Field(..., description="The response from the AI")
    session_id: str = Field(..., description="The session ID associated with the chat")

from datetime import datetime
from uuid import UUID

class ChatSessionCreate(BaseModel):
    mode: str = Field("guideline", description="The mode to use for this chat session")
    title: Optional[str] = Field(None, description="Optional title for the chat session")

class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    mode: str
    title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
