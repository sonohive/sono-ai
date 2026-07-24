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
    sft_pending_reviews: int
    sft_completed_reviews: int

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
    total_text: int
    text_guideline: int
    text_research: int
    total_url: int
    url_guideline: int
    url_research: int
    total_pdf: int
    pdf_guideline: int
    pdf_research: int
    total_media: int
    media_guideline: int
    media_research: int

class TopicResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    data_count: int = 0
    created_at: str

class TopicCreateRequest(BaseModel):
    name: str
    description: str | None = None

class TopicUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None

class KBItemResponse(BaseModel):
    id: str
    training_type: str
    mode: str
    topic_id: str | None = None
    country: str | None = None
    source_name: str
    source_url: str | None = None
    content_url: str | None = None
    label: str | None = None
    description: str | None = None
    created_at: str
    updated_at: str | None = None

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

class KBUpdateRequest(BaseModel):
    mode: str | None = None
    topic_id: str | None = None
    country: str | None = None
    source_name: str | None = None
    source_url: str | None = None
    content: str | None = None
    label: str | None = None
    description: str | None = None

class FeedbackStatsResponse(BaseModel):
    total: int
    positive_percentage: int
    negative_percentage: int

class FeedbackItemResponse(BaseModel):
    id: str
    session_id: str
    query_id: str
    date: str
    user_first_name: str | None = None
    query: str
    response_snippet: str
    is_liked: bool
    feedback_text: str | None = None

class FeedbackListResponse(BaseModel):
    stats: FeedbackStatsResponse
    items: List[FeedbackItemResponse]
    total: int
    page: int
    size: int
    pages: int
class QueryLogItemResponse(BaseModel):
    id: str
    date: str
    user_name: str
    mode: str
    query: str
    response: str

class PaginatedQueryLogsResponse(BaseModel):
    items: List[QueryLogItemResponse]
    total: int
    page: int
    pages: int

