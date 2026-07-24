from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, List, Dict
import uuid

from db.session import get_db
from models.domain import QueryLog, QueryFeedback, RLHFReview
from models.sft_reviewer import SFTReviewer
from api.sft_deps import get_current_sft_or_admin

router = APIRouter()

class ReviewSubmission(BaseModel):
    status: str
    grading_tags: Optional[List[str]] = []
    retrained_data: Optional[str] = None

@router.get("/queue/queries")
async def get_pending_queries(
    user=Depends(get_current_sft_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch queries that are unanswered or downvoted and not yet reviewed.
    """
    try:
        from sqlalchemy import or_
        query = (
            select(QueryLog, QueryFeedback.is_liked, QueryFeedback.feedback_text)
            .outerjoin(QueryFeedback, QueryFeedback.query_id == QueryLog.id)
            .outerjoin(RLHFReview, RLHFReview.query_id == QueryLog.id)
            .where(
                or_(QueryLog.is_unanswered == True, QueryFeedback.is_liked == False)
            )
            .where(
                or_(RLHFReview.id.is_(None), RLHFReview.status == 'pending')
            )
            .order_by(QueryLog.created_at.desc())
        )
        result = await db.execute(query)
        
        pending = []
        for log, is_liked, feedback_text in result.all():
            query_type = "unanswered"
            if is_liked is False:
                query_type = "feedback"
            if log.query and log.query.startswith("[KB Review]"):
                query_type = "training data"
                
            clean_query = log.query.replace("[KB Review] ", "") if log.query and log.query.startswith("[KB Review]") else log.query

            pending.append({
                "id": str(log.id),
                "query": clean_query,
                "response": log.response,
                "type": query_type,
                "is_unanswered": log.is_unanswered,
                "is_liked": is_liked,
                "feedback_text": feedback_text,
                "created_at": log.created_at
            })
        return pending
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/review/query/{query_id}")
async def submit_review(
    query_id: str,
    submission: ReviewSubmission,
    user=Depends(get_current_sft_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an RLHF Review with retrained data.
    """
    # Check if review already exists
    result = await db.execute(select(RLHFReview).where(RLHFReview.query_id == uuid.UUID(query_id)))
    review = result.scalar_one_or_none()
    
    admin_id = user.id if getattr(user, 'is_admin', False) else None
    sft_reviewer_id = user.id if getattr(user, 'is_sft_reviewer', False) else None

    if review:
        # Update existing
        review.status = submission.status
        review.retrained_data = submission.retrained_data
        review.grading_tags = submission.grading_tags
        review.admin_id = admin_id
        review.sft_reviewer_id = sft_reviewer_id
    else:
        review = RLHFReview(
            query_id=uuid.UUID(query_id),
            status=submission.status,
            retrained_data=submission.retrained_data,
            grading_tags=submission.grading_tags,
            admin_id=admin_id,
            sft_reviewer_id=sft_reviewer_id
        )
        db.add(review)
        
    await db.commit()
    return {"status": "success", "message": "Review saved"}

class PlaygroundChatRequest(BaseModel):
    message: str
    kb_id: str
    session_id: str

from sse_starlette.sse import EventSourceResponse
from services.rag import RAGService
from langchain_core.documents import Document
from db.session import AsyncSessionLocal
from models.domain import KnowledgeBaseEmbedding

# A specialized isolated function that bypasses regular RAG
async def stream_playground_chat(message: str, kb_id: str, session_id: str):
    rag = RAGService()
    query_vector = await rag.embeddings.aembed_query(message)
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(KnowledgeBaseEmbedding)
            .where(KnowledgeBaseEmbedding.knowledge_id == uuid.UUID(kb_id))
            .order_by(KnowledgeBaseEmbedding.embedding.cosine_distance(query_vector))
            .limit(5)
        )
        docs = result.scalars().all()
        
    context = "\n\n".join([doc.chunk_text for doc in docs])
    
    from langchain_core.messages import SystemMessage, HumanMessage
    messages = [
        SystemMessage(content=f"You are a test AI in the SFT Playground. Answer the user strictly using this context. If the context does not contain the answer, say 'I do not know'.\n\nContext:\n{context}"),
        HumanMessage(content=message)
    ]
    
    async def event_generator():
        try:
            async for chunk in rag.llm.astream(messages):
                if chunk.content:
                    yield {
                        "event": "message",
                        "data": chunk.content
                    }
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

@router.post("/playground/chat")
async def playground_chat(
    request: PlaygroundChatRequest,
    user=Depends(get_current_sft_or_admin)
):
    return await stream_playground_chat(request.message, request.kb_id, request.session_id)

@router.get("/export")
async def export_sft_data(
    user=Depends(get_current_sft_or_admin),
    db: AsyncSession = Depends(get_db)
):
    from fastapi.responses import StreamingResponse
    import io
    import json
    
    result = await db.execute(
        select(QueryLog, RLHFReview)
        .join(RLHFReview, RLHFReview.query_id == QueryLog.id)
        .where(RLHFReview.status == "reviewed")
    )
    
    output = io.StringIO()
    for log, review in result.all():
        row = {
            "messages": [
                {"role": "user", "content": log.query},
                {"role": "assistant", "content": review.retrained_data}
            ]
        }
        output.write(json.dumps(row) + "\n")
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/jsonl",
        headers={"Content-Disposition": "attachment; filename=sft_dataset.jsonl"}
    )

from models.domain import KnowledgeBaseMetadata

@router.get("/knowledge")
async def get_sft_knowledge(
    user=Depends(get_current_sft_or_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(KnowledgeBaseMetadata.id, KnowledgeBaseMetadata.source_name, KnowledgeBaseMetadata.training_type)
        .order_by(KnowledgeBaseMetadata.created_at.desc())
    )
    items = result.all()
    return [{"id": str(i.id), "source_name": i.source_name, "training_type": i.training_type} for i in items]
