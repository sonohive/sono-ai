from pydantic import BaseModel
from typing import List

class OverviewStatsResponse(BaseModel):
    guideline_queries_28d: int
    research_queries_28d: int
    guideline_queries_total: int
    research_queries_total: int
    total_users: int
    active_users_28d: int
    suspended_users: int
    new_users_28d: int
    kb_size: int

class TrendPoint(BaseModel):
    name: str
    queries: int

class TrendDataResponse(BaseModel):
    data: List[TrendPoint]

class ChallengeDataResponse(BaseModel):
    unanswered_queries: int
    likes_percentage: int
    dislikes_percentage: int

class UserAdminResponse(BaseModel):
    id: str
    full_name: str | None
    email: str
    role: str
    is_active: bool
    total_queries: int
    created_at: str

class PaginatedUserResponse(BaseModel):
    items: List[UserAdminResponse]
    total: int
    page: int
    size: int
    pages: int

class UserStatusUpdate(BaseModel):
    is_active: bool

class KBStatsResponse(BaseModel):
    total_kb_data: int
    total_chunking_data: int
    redis_total_keys: int
    total_images_data: int

class KBItemResponse(BaseModel):
    id: str
    training_type: str
    mode: str
    topic_id: str | None = None
    country: str | None = None
    source_name: str
    source_url: str | None = None
    content_url: str | None = None
    created_at: str

class PaginatedKBResponse(BaseModel):
    items: List[KBItemResponse]
    total: int
    page: int
    size: int
    pages: int

class TextIngestRequest(BaseModel):
    training_mode: str
    topic_id: str | None = None
    country: str | None = None
    source_name: str
    source_url: str | None = None
    content: str

class URLIngestRequest(BaseModel):
    training_mode: str
    topic_id: str | None = None
    country: str | None = None
    source_name: str
    source_url: str
