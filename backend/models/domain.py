from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from pgvector.sqlalchemy import Vector
from .user import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KnowledgeBaseMetadata(Base):
    __tablename__ = "kb_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    training_type = Column(String, nullable=False) # 'pdf', 'url', 'text', 'media'
    mode = Column(String, nullable=False) # 'guideline' or 'research'
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    country = Column(String, nullable=True) # e.g. UK, USA
    source_name = Column(String, nullable=False) # e.g. Fetal Care Protocol
    source_url = Column(String, nullable=True) # Reference link
    content_url = Column(String, nullable=True) # Raw file/image URL in R2 if applicable
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SavedResponse(Base):
    __tablename__ = "saved_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KnowledgeBaseEmbedding(Base):
    __tablename__ = "kb_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    knowledge_id = Column(UUID(as_uuid=True), ForeignKey("kb_metadata.id"), nullable=True)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(3072), nullable=False) # 3072 is OpenAI's text-embedding-3-large dimension
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mode = Column(String, nullable=False, default="guideline") # "guideline" or "research"
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QueryFeedback(Base):
    __tablename__ = "query_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    query_id = Column(UUID(as_uuid=True), ForeignKey("query_logs.id", ondelete="CASCADE"), nullable=False)
    is_liked = Column(Boolean, nullable=False)
    feedback_text = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RLHFReview(Base):
    __tablename__ = "rlhf_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    query_id = Column(UUID(as_uuid=True), ForeignKey("query_logs.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="pending") # "pending", "reviewed", "ignored"
    flag_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
