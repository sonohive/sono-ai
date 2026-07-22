from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class AdminResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    permissions: List[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "custom"
    permissions: List[str] = []

class InviteResponse(BaseModel):
    message: str
    invite_url: str # Just for development/debugging, normally sent via email

class AcceptInviteRequest(BaseModel):
    token: str
    password: str
    full_name: str

class AdminToken(BaseModel):
    access_token: str
    token_type: str
