from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's message to the AI")
    session_id: str = Field(..., description="Unique session ID to track chat memory")
    topic_id: Optional[str] = Field(None, description="Optional topic ID if the chat is categorized")

class ChatResponse(BaseModel):
    content: str = Field(..., description="The response from the AI")
    session_id: str = Field(..., description="The session ID associated with the chat")
