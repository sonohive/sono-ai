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

@router.post("/stream")
async def stream_chat(
    request: ChatRequest
):
    """
    Stream chat response using Server-Sent Events (SSE).
    """
    # For now, we namespace the session_id to prevent collisions.
    user_session_id = f"user:guest:session:{request.session_id}"

    async def event_generator():
        try:
            async for chunk in rag_service.stream_chat(request.message, user_session_id, request.mode):
                yield {
                    "event": "message",
                    "data": chunk
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
