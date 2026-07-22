from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class SavedResponseCreate(BaseModel):
    session_id: UUID = Field(..., description="The chat session ID this bookmark belongs to")
    question: str = Field(..., description="The user's question")
    answer: str = Field(..., description="The AI's answer")

class SavedResponseItem(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    question: str
    answer: str
    created_at: datetime
    mode: Optional[str] = Field(None, description="The mode this response was generated in, joined from session")

    class Config:
        from_attributes = True
