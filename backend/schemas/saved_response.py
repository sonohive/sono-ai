from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class SavedResponseCreate(BaseModel):
    topic_id: Optional[UUID] = Field(None, description="Optional topic ID")
    question: str = Field(..., description="The user's question")
    answer: str = Field(..., description="The AI's response")

class SavedResponseSchema(BaseModel):
    id: UUID
    user_id: UUID
    topic_id: Optional[UUID]
    question: str
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True
