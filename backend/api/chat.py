from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from schemas.chat import ChatRequest, ChatSessionCreate, ChatSessionResponse
from services.rag import RAGService
from api.deps import get_current_user
from models.user import User
from models.domain import ChatSession
from db.session import get_db

router = APIRouter()
rag_service = RAGService()

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_session = ChatSession(
        user_id=current_user.id,
        mode=session_data.mode,
        title=session_data.title or "New Chat"
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
    )
    return result.scalars().all()

from pydantic import BaseModel
from db.session import AsyncSessionLocal
from models.domain import QueryLog, QueryFeedback
import uuid

class FeedbackRequest(BaseModel):
    query_id: str
    is_liked: bool
    feedback_text: str | None = None

@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Stream chat response using Server-Sent Events (SSE).
    """
    user_session_id = f"user:guest:session:{request.session_id}"

    async def event_generator():
        full_response = ""
        try:
            async for chunk in rag_service.stream_chat(request.message, user_session_id, request.mode):
                full_response += chunk
                yield {
                    "event": "message",
                    "data": chunk
                }
                
            # Determine if the query is unanswered based on specific phrases
            fallback_phrases = ["I don't know", "I do not know", "I cannot answer this", "not enough information", "I don't have enough information"]
            is_unanswered = any(phrase.lower() in full_response.lower() for phrase in fallback_phrases)
            
            # Save QueryLog
            async with AsyncSessionLocal() as session:
                new_query = QueryLog(
                    user_id=current_user.id,
                    session_id=uuid.UUID(request.session_id) if request.session_id and request.session_id != 'default_session' else current_user.id, # Hack for default
                    query=request.message,
                    response=full_response,
                    is_unanswered=is_unanswered
                )
                session.add(new_query)
                await session.commit()
                await session.refresh(new_query)
                
                # Send query_id to frontend for feedback
                yield {
                    "event": "query_id",
                    "data": str(new_query.id)
                }

            # Send a completion event
            yield {
                "event": "done",
                "data": "[DONE]"
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": str(e)
            }
            
    return EventSourceResponse(event_generator())

@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_feedback = QueryFeedback(
        query_id=uuid.UUID(request.query_id),
        is_liked=request.is_liked,
        feedback_text=request.feedback_text
    )
    db.add(new_feedback)
    await db.commit()
    return {"message": "Feedback submitted successfully"}
