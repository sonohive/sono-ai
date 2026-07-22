from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from schemas.chat import ChatRequest
from services.rag import RAGService
from api.deps import get_current_user
from models.user import User

router = APIRouter()
rag_service = RAGService()

@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Stream chat response using Server-Sent Events (SSE).
    Only accessible by authenticated users.
    """
    # Ensure the session_id belongs to the user in a real app.
    # For now, we namespace the session_id with the user id to prevent collisions.
    user_session_id = f"user:{current_user.id}:session:{request.session_id}"

    async def event_generator():
        try:
            async for chunk in rag_service.stream_chat(request.message, user_session_id):
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
