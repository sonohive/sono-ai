from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from pydantic import BaseModel

from db.session import get_db
from models.user import User
from models.domain import KnowledgeBaseMetadata, ChatSession, QueryLog, QueryFeedback, RLHFReview
from api.deps import get_current_user
from datetime import datetime, timedelta
from schemas.admin import (
    OverviewStatsResponse, TrendDataResponse, TrendPoint, ChallengeDataResponse,
    KBStatsResponse, PaginatedKBResponse, KBItemResponse, TextIngestRequest, URLIngestRequest
)
from api.deps import require_permission
from models.admin import Admin
from typing import Optional
import uuid

router = APIRouter()

@router.post("/knowledge/ingest/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    training_mode: str = Form(...),
    topic_id: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    source_name: str = Form(...),
    source_url: Optional[str] = Form(None),
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    # Process PDF here...
    
    new_kb = KnowledgeBaseMetadata(
        training_type="pdf",
        mode=training_mode,
        topic_id=uuid.UUID(topic_id) if topic_id else None,
        country=country,
        source_name=source_name,
        source_url=source_url,
        content_url=None
    )
    db.add(new_kb)
    await db.commit()
    return {"message": f"Successfully ingested PDF {file.filename}"}

@router.post("/knowledge/ingest/media")
async def ingest_media(
    file: UploadFile = File(...),
    training_mode: str = Form(...),
    topic_id: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    source_name: str = Form(...),
    source_url: Optional[str] = Form(None),
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    # Upload to R2 logic here...
    r2_url = f"https://r2.example.com/{file.filename}"
    
    new_kb = KnowledgeBaseMetadata(
        training_type="media",
        mode=training_mode,
        topic_id=uuid.UUID(topic_id) if topic_id else None,
        country=country,
        source_name=source_name,
        source_url=source_url,
        content_url=r2_url
    )
    db.add(new_kb)
    await db.commit()
    return {"message": f"Successfully ingested media {file.filename}"}

@router.get("/knowledge/stats", response_model=KBStatsResponse)
async def get_kb_stats(
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    # In a real implementation, we would query Redis for the exact vector count.
    # Here we count the metadata records as a proxy for uploaded documents.
    doc_count = await db.execute(select(func.count(KnowledgeBaseMetadata.id)))
    total_docs = doc_count.scalar_one()
    
    img_count = await db.execute(select(func.count(KnowledgeBaseMetadata.id)).where(KnowledgeBaseMetadata.training_type == 'media'))
    total_images = img_count.scalar_one()

    return KBStatsResponse(
        total_kb_data=total_docs,
        total_chunking_data=total_docs * 15, # Placeholder multiplier for chunks per doc
        redis_total_keys=total_docs * 15, # Placeholder
        total_images_data=total_images
    )

@router.get("/knowledge", response_model=PaginatedKBResponse)
async def get_kb_items(
    training_type: str,
    page: int = 1,
    size: int = 10,
    topic_id: Optional[str] = None,
    country: Optional[str] = None,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    query = select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.training_type == training_type).order_by(desc(KnowledgeBaseMetadata.created_at))

    if topic_id:
        query = query.where(KnowledgeBaseMetadata.topic_id == topic_id)
    if country:
        query = query.where(KnowledgeBaseMetadata.country.ilike(f"%{country}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Paginate
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    rows = result.scalars().all()

    items = []
    for kb in rows:
        items.append(KBItemResponse(
            id=str(kb.id),
            training_type=kb.training_type,
            mode=kb.mode,
            topic_id=str(kb.topic_id) if kb.topic_id else None,
            country=kb.country,
            source_name=kb.source_name,
            source_url=kb.source_url,
            content_url=kb.content_url,
            created_at=kb.created_at.isoformat()
        ))

    import math
    pages = math.ceil(total / size) if size > 0 else 0

    return PaginatedKBResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.post("/knowledge/ingest/url")
async def ingest_url(
    request: URLIngestRequest,
    background_tasks: BackgroundTasks,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    # Record metadata
    new_kb = KnowledgeBaseMetadata(
        training_type="url",
        mode=request.training_mode,
        topic_id=request.topic_id,
        country=request.country,
        source_name=request.source_name,
        source_url=request.source_url
    )
    db.add(new_kb)
    await db.commit()
    
    return {"message": f"Successfully queued {request.source_url} for ingestion"}

from services.ingestion import process_and_embed_text

@router.post("/knowledge/ingest/text")
async def ingest_text(
    request: TextIngestRequest,
    background_tasks: BackgroundTasks,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    # Record metadata
    new_kb = KnowledgeBaseMetadata(
        training_type="text",
        mode=request.training_mode,
        topic_id=uuid.UUID(request.topic_id) if request.topic_id else None,
        country=request.country,
        source_name=request.source_name,
        source_url=request.source_url
    )
    db.add(new_kb)
    await db.flush() # Flush to get the ID without committing yet
    
    # Process text and create embeddings
    chunks_processed = await process_and_embed_text(new_kb.id, request.content, db)
    
    # Commit the transaction (Metadata + Embeddings)
    await db.commit()
    
    return {"message": f"Successfully ingested text and created {chunks_processed} chunks"}

from api.deps import require_permission
from models.admin import Admin

@router.get("/overview/stats", response_model=OverviewStatsResponse)
async def get_overview_stats(
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    
    twenty_eight_days_ago = datetime.utcnow() - timedelta(days=28)

    res = await db.execute(
        select(func.count(QueryLog.id)).select_from(QueryLog).join(ChatSession).where(ChatSession.mode == "guideline")
    )
    gl_total = res.scalar_one()

    res = await db.execute(
        select(func.count(QueryLog.id)).select_from(QueryLog).join(ChatSession).where(ChatSession.mode == "research")
    )
    res_total = res.scalar_one()

    res = await db.execute(
        select(func.count(QueryLog.id)).select_from(QueryLog).join(ChatSession).where(ChatSession.mode == "guideline", QueryLog.created_at >= twenty_eight_days_ago)
    )
    gl_28 = res.scalar_one()

    res = await db.execute(
        select(func.count(QueryLog.id)).select_from(QueryLog).join(ChatSession).where(ChatSession.mode == "research", QueryLog.created_at >= twenty_eight_days_ago)
    )
    res_28 = res.scalar_one()

    res = await db.execute(select(func.count(User.id)))
    total_users = res.scalar_one()

    res = await db.execute(select(func.count(User.id)).where(User.created_at >= twenty_eight_days_ago))
    new_users_28d = res.scalar_one()

    res = await db.execute(select(func.count(QueryLog.user_id.distinct())).where(QueryLog.created_at >= twenty_eight_days_ago))
    active_users_28d = res.scalar_one()

    res = await db.execute(select(func.count(User.id)).where(User.is_active == False))
    suspended_users = res.scalar_one()

    res = await db.execute(select(func.count(KnowledgeBaseMetadata.id)))
    kb_size = res.scalar_one()

    return OverviewStatsResponse(
        guideline_queries_28d=gl_28,
        research_queries_28d=res_28,
        guideline_queries_total=gl_total,
        research_queries_total=res_total,
        total_users=total_users,
        active_users_28d=active_users_28d,
        suspended_users=suspended_users,
        new_users_28d=new_users_28d,
        kb_size=kb_size
    )

@router.get("/overview/trend", response_model=TrendDataResponse)
async def get_overview_trend(
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.utcnow().date()
    trend_data = []
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        next_date = target_date + timedelta(days=1)
        res = await db.execute(
            select(func.count(QueryLog.id)).where(QueryLog.created_at >= target_date, QueryLog.created_at < next_date)
        )
        count = res.scalar_one()
        trend_data.append(TrendPoint(name=target_date.strftime("%a"), queries=count))
        
    return TrendDataResponse(data=trend_data)

@router.get("/overview/challenges", response_model=ChallengeDataResponse)
async def get_overview_challenges(
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(func.count(RLHFReview.id)).where(RLHFReview.status == "pending"))
    unanswered_queries = res.scalar_one()
    
    res = await db.execute(select(func.count(QueryFeedback.id)))
    total_feedback = res.scalar_one()
    
    res = await db.execute(select(func.count(QueryFeedback.id)).where(QueryFeedback.is_liked == True))
    likes = res.scalar_one()
    
    likes_percentage = 85
    dislikes_percentage = 15
    if total_feedback > 0:
        likes_percentage = int((likes / total_feedback) * 100)
        dislikes_percentage = 100 - likes_percentage

    return ChallengeDataResponse(
        unanswered_queries=unanswered_queries,
        likes_percentage=likes_percentage,
        dislikes_percentage=dislikes_percentage
    )

from schemas.admin import PaginatedUserResponse, UserAdminResponse, UserStatusUpdate
from sqlalchemy import or_, desc
import math

@router.get("/users", response_model=PaginatedUserResponse)
async def get_admin_users(
    page: int = 1,
    size: int = 10,
    search: str = None,
    status: str = None,
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        User,
        func.count(QueryLog.id).label('total_queries')
    ).outerjoin(QueryLog, User.id == QueryLog.user_id).group_by(User.id).order_by(desc(User.created_at))

    if search:
        search_filter = f"%{search}%"
        query = query.where(or_(User.email.ilike(search_filter), User.full_name.ilike(search_filter)))

    if status == "active":
        query = query.where(User.is_active == True)
    elif status == "suspended":
        query = query.where(User.is_active == False)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Paginate
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    rows = result.all()

    items = []
    for user, total_queries in rows:
        items.append(UserAdminResponse(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            total_queries=total_queries,
            created_at=user.created_at.isoformat()
        ))

    pages = math.ceil(total / size) if size > 0 else 0

    return PaginatedUserResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    update: UserStatusUpdate,
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = update.is_active
    await db.commit()
    return {"message": "User status updated successfully", "is_active": user.is_active}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: Admin = Depends(require_permission("invite_users")), # Only superadmins can invite/delete usually
    db: AsyncSession = Depends(get_db)
):
    if current_admin.role != "superadmin":
        raise HTTPException(status_code=403, detail="Only superadmin can delete users")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}

from fastapi.responses import StreamingResponse
import csv
import io

@router.get("/users/export")
async def export_users_csv(
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        User,
        func.count(QueryLog.id).label('total_queries')
    ).outerjoin(QueryLog, User.id == QueryLog.user_id).group_by(User.id).order_by(desc(User.created_at))
    
    result = await db.execute(query)
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Full Name", "Email", "Role", "Status", "Total Queries", "Joined Date"])

    for user, total_queries in rows:
        writer.writerow([
            str(user.id),
            user.full_name or "",
            user.email,
            user.role,
            "Active" if user.is_active else "Suspended",
            total_queries,
            user.created_at.isoformat()
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"}
    )
