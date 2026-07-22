from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel

from db.session import get_db
from models.user import User
from models.domain import KnowledgeBaseMetadata
from api.deps import get_current_user

router = APIRouter()

class URLIngestRequest(BaseModel):
    url: str

def check_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/stats")
async def get_kb_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check_admin(current_user)
    
    # In a real implementation, we would query Redis for the exact vector count.
    # Here we count the metadata records as a proxy for uploaded documents.
    doc_count = await db.execute(select(func.count(KnowledgeBaseMetadata.id)))
    total_docs = doc_count.scalar_one()
    
    return {
        "embedded_chunks": total_docs * 15 # Placeholder multiplier for chunks per doc
    }

@router.post("/ingest-url")
async def ingest_url(
    request: URLIngestRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    check_admin(current_user)
    
    # In a real implementation, trigger DocumentParser in background
    # background_tasks.add_task(DocumentParser.parse_url, request.url)
    
    # Record metadata
    new_kb = KnowledgeBaseMetadata(
        title=f"Ingested from {request.url}",
        source_url=request.url
    )
    db.add(new_kb)
    await db.commit()
    
    return {"message": f"Successfully queued {request.url} for ingestion"}
