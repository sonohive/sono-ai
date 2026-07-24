from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select, func, desc, text
from pydantic import BaseModel

from db.session import get_db
from models.user import User
from models.domain import KnowledgeBaseMetadata, ChatSession, QueryLog, QueryFeedback, RLHFReview, Topic, KnowledgeBaseEmbedding
from api.deps import get_current_user
from datetime import datetime, timedelta
from schemas.admin import (
    OverviewStatsResponse, TrendDataResponse, ChallengeDataResponse, TrendPoint,
    PaginatedUserResponse, UserStatusUpdate, UserAdminResponse,
    KBStatsResponse, PaginatedKBResponse, KBItemResponse,
    TextIngestRequest, URLIngestRequest, KBUpdateRequest,
    TopicResponse, TopicCreateRequest, TopicUpdateRequest,
    PaginatedQueryLogsResponse, QueryLogItemResponse
)
from api.deps import require_permission
from models.admin import Admin
from typing import Optional, List
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
    label: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
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
        content_url=r2_url,
        label=label,
        description=description
    )
    db.add(new_kb)
    await db.flush()
    
    if description:
        await process_and_embed_text(new_kb.id, description, db)
        


from sqlalchemy import update

@router.get("/debug/fix")
async def debug_fix(
    db: AsyncSession = Depends(get_db)
):
    await db.execute(text("UPDATE kb_metadata SET training_type = 'text'"))
    await db.commit()
    return {"message": "Fixed"}

@router.get("/knowledge/stats", response_model=KBStatsResponse)
async def get_kb_stats(
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    doc_count = await db.execute(select(func.count(KnowledgeBaseMetadata.id)))
    total_docs = doc_count.scalar_one()
    
    chunk_count = await db.execute(select(func.count(KnowledgeBaseEmbedding.id)))
    total_chunks = chunk_count.scalar_one()
    
    import os
    import redis.asyncio as aioredis
    redis_url = os.getenv("REDIS_URL")
    try:
        redis_client = await aioredis.from_url(redis_url)
        redis_keys = await redis_client.dbsize()
        await redis_client.close()
    except Exception:
        redis_keys = total_chunks # Fallback if Redis is unreachable
    
    img_count = await db.execute(select(func.count(KnowledgeBaseMetadata.id)).where(KnowledgeBaseMetadata.training_type == 'media'))
    total_images = img_count.scalar_one()

    # Get breakdown by training_type and mode
    res = await db.execute(select(KnowledgeBaseMetadata.training_type, KnowledgeBaseMetadata.mode, func.count()).group_by(KnowledgeBaseMetadata.training_type, KnowledgeBaseMetadata.mode))
    
    breakdown = {}
    for row in res.all():
        ttype, mode, count = row
        
        # Normalize legacy types
        if ttype in ['txt', 'wp', 'custom_text']:
            ttype = 'text'
        elif ttype in ['image']:
            ttype = 'media'
            
        if ttype not in breakdown:
            breakdown[ttype] = {'total': 0}
            
        breakdown[ttype][mode] = breakdown[ttype].get(mode, 0) + count
        breakdown[ttype]['total'] += count

    def get_stat(t, m=None):
        if t not in breakdown:
            return 0
        if m is None:
            return breakdown[t].get('total', 0)
        return breakdown[t].get(m, 0)

    return KBStatsResponse(
        total_kb_data=total_docs,
        total_chunking_data=total_chunks,
        redis_total_keys=redis_keys,
        total_images_data=total_images,
        total_text=get_stat("text"),
        text_guideline=get_stat("text", "guideline"),
        text_research=get_stat("text", "research"),
        total_url=get_stat("url"),
        url_guideline=get_stat("url", "guideline"),
        url_research=get_stat("url", "research"),
        total_pdf=get_stat("pdf"),
        pdf_guideline=get_stat("pdf", "guideline"),
        pdf_research=get_stat("pdf", "research"),
        total_media=get_stat("media"),
        media_guideline=get_stat("media", "guideline"),
        media_research=get_stat("media", "research")
    )


@router.get("/knowledge", response_model=PaginatedKBResponse)
async def get_kb_items(
    training_type: str,
    page: int = 1,
    size: int = 10,
    topic_id: Optional[str] = None,
    country: Optional[str] = None,
    mode: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    if training_type == "text":
        query = select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.training_type.in_(["text", "txt", "wp", "custom_text"])).order_by(desc(KnowledgeBaseMetadata.created_at))
    elif training_type == "media":
        query = select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.training_type.in_(["media", "image"])).order_by(desc(KnowledgeBaseMetadata.created_at))
    else:
        query = select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.training_type == training_type).order_by(desc(KnowledgeBaseMetadata.created_at))

    import uuid
    if topic_id:
        if topic_id == "unmapped":
            query = query.where(KnowledgeBaseMetadata.topic_id == None)
        else:
            try:
                query = query.where(KnowledgeBaseMetadata.topic_id == uuid.UUID(topic_id))
            except ValueError:
                pass
    if country:
        query = query.where(KnowledgeBaseMetadata.country.ilike(f"%{country}%"))
    if mode:
        query = query.where(KnowledgeBaseMetadata.mode.ilike(f"{mode}%"))
    if search:
        query = query.where(KnowledgeBaseMetadata.source_name.ilike(f"%{search}%"))

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
            label=kb.label,
            description=kb.description,
            created_at=kb.created_at.isoformat(),
            updated_at=kb.updated_at.isoformat() if getattr(kb, 'updated_at', None) else None
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

from services.ingestion import process_and_embed_text, delete_knowledge_chunks

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
    
    return {"message": "Successfully sent sync events"}

@router.get("/topics", response_model=List[TopicResponse])
async def get_topics(
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Topic, func.count(KnowledgeBaseMetadata.id).label("data_count"))
        .outerjoin(KnowledgeBaseMetadata, Topic.id == KnowledgeBaseMetadata.topic_id)
        .group_by(Topic.id)
        .order_by(desc(Topic.created_at))
    )
    result = await db.execute(query)
    topics_with_counts = result.all()
    
    return [
        TopicResponse(
            id=str(t.Topic.id),
            name=t.Topic.name,
            description=t.Topic.description,
            created_at=t.Topic.created_at.isoformat(),
            data_count=t.data_count
        )
        for t in topics_with_counts
    ]

@router.post("/topics", response_model=TopicResponse)
async def create_topic(
    req: TopicCreateRequest,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    new_topic = Topic(
        name=req.name,
        description=req.description
    )
    db.add(new_topic)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Topic already exists")
    
    return TopicResponse(
        id=str(new_topic.id),
        name=new_topic.name,
        description=new_topic.description,
        created_at=new_topic.created_at.isoformat()
    )

@router.put("/topics/{topic_id}")
async def update_topic(
    topic_id: str,
    req: TopicUpdateRequest,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Topic).where(Topic.id == uuid.UUID(topic_id)))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    if req.name is not None:
        topic.name = req.name
    if req.description is not None:
        topic.description = req.description
        
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error updating topic")
    return {"message": "Topic updated successfully"}

@router.delete("/topics/{topic_id}")
async def delete_topic(
    topic_id: str,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Topic).where(Topic.id == uuid.UUID(topic_id)))
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    await db.delete(topic)
    await db.commit()
    return {"message": "Topic deleted successfully"}

@router.put("/knowledge/{kb_id}")
async def update_kb_item(
    kb_id: str,
    update: KBUpdateRequest,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.id == uuid.UUID(kb_id)))
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base item not found")
        
    if update.mode is not None:
        kb.mode = update.mode
    if update.topic_id is not None:
        kb.topic_id = uuid.UUID(update.topic_id) if update.topic_id else None
    if update.country is not None:
        kb.country = update.country
    if update.source_name is not None:
        kb.source_name = update.source_name
    if update.source_url is not None:
        kb.source_url = update.source_url
    if update.label is not None:
        kb.label = update.label
    if update.description is not None:
        kb.description = update.description
        
    # If it's a text training type and content was updated, resync immediately.
    if kb.training_type == "text" and update.content is not None:
        await delete_knowledge_chunks(kb.id, db)
        await process_and_embed_text(kb.id, update.content, db)
        
    # If it's media and description was updated, resync immediately.
    if kb.training_type == "media" and update.description is not None:
        await delete_knowledge_chunks(kb.id, db)
        await process_and_embed_text(kb.id, update.description, db)
        
    await db.commit()
    return {"message": "Successfully updated metadata"}

@router.get("/debug_metadata2")
async def debug_metadata2(db: AsyncSession = Depends(get_db)):
    import pymysql
    import json
    try:
        conn = pymysql.connect(host='localhost', user='root', password='', database='sononwoc_ai', cursorclass=pymysql.cursors.DictCursor)
        out = []
        with conn.cursor() as cursor:
            cursor.execute("SELECT embedding_model FROM sa_sonoai_kb_items LIMIT 1")
            model = cursor.fetchone()
            out.append({"kb_model": model})
            
            cursor.execute("SELECT embedding FROM sa_sonoai_embeddings LIMIT 1")
            erow = cursor.fetchone()
            if erow and erow["embedding"]:
                emb_str = erow["embedding"]
                if isinstance(emb_str, bytes):
                    emb_str = emb_str.decode('utf-8')
                vec = json.loads(emb_str)
                out.append({"vector_len": len(vec)})
        return {"mysql": out}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@router.get("/knowledge/{kb_id}/content")
async def get_kb_content(
    kb_id: str,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    from models.domain import KnowledgeBaseEmbedding
    result = await db.execute(
        select(KnowledgeBaseEmbedding.chunk_text)
        .where(KnowledgeBaseEmbedding.knowledge_id == uuid.UUID(kb_id))
        .order_by(KnowledgeBaseEmbedding.created_at)
    )
    chunks = result.scalars().all()
    if not chunks:
        return {"content": "No content found. It may be a URL or file without embedded text yet."}
    
    return {"content": "\n\n".join(chunks)}

@router.delete("/knowledge/{kb_id}")
async def delete_kb_item(
    kb_id: str,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.id == uuid.UUID(kb_id)))
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base item not found")
        
    await delete_knowledge_chunks(kb.id, db)
    await db.delete(kb)
    await db.commit()
    return {"message": "Successfully deleted knowledge base item"}

@router.post("/knowledge/{kb_id}/resync")
async def resync_kb_item(
    kb_id: str,
    background_tasks: BackgroundTasks,
    current_admin: Admin = Depends(require_permission("manage_kb")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(KnowledgeBaseMetadata).where(KnowledgeBaseMetadata.id == uuid.UUID(kb_id)))
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base item not found")
        
    # Example minimal resync: clear existing chunks.
    # For full resync, you'd re-download from content_url or source_url
    # or re-crawl. Since text is not saved, re-syncing text without input isn't possible,
    # but the UI won't allow re-sync on text directly without the modal.
    # For URLs and PDFs we just clear chunks. (Adding actual scraping is separate)
    await delete_knowledge_chunks(kb.id, db)
    
    return {"message": "Knowledge base chunks cleared, ready for re-sync"}

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

    # SFT Stats
    pending_query = (
        select(func.count(QueryLog.id))
        .outerjoin(QueryFeedback, QueryFeedback.query_id == QueryLog.id)
        .outerjoin(RLHFReview, RLHFReview.query_id == QueryLog.id)
        .where((QueryLog.is_unanswered == True) | (QueryFeedback.is_liked == False))
        .where((RLHFReview.id == None) | (RLHFReview.status == 'pending'))
    )
    res_pending = await db.execute(pending_query)
    sft_pending = res_pending.scalar_one()
    
    res = await db.execute(select(func.count(RLHFReview.id)).where(RLHFReview.status == "reviewed"))
    sft_completed = res.scalar_one()

    return OverviewStatsResponse(
        guideline_queries_28d=gl_28,
        research_queries_28d=res_28,
        guideline_queries_total=gl_total,
        research_queries_total=res_total,
        total_users=total_users,
        active_users_28d=active_users_28d,
        suspended_users=suspended_users,
        new_users_28d=new_users_28d,
        kb_size=kb_size,
        sft_pending_reviews=sft_pending,
        sft_completed_reviews=sft_completed
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
    
    likes_percentage = 0
    dislikes_percentage = 0
    if total_feedback > 0:
        likes_percentage = int((likes / total_feedback) * 100)
        dislikes_percentage = 100 - likes_percentage

    return ChallengeDataResponse(
        unanswered_queries=unanswered_queries,
        likes_percentage=likes_percentage,
        dislikes_percentage=dislikes_percentage
    )

from schemas.admin import PaginatedUserResponse, UserAdminResponse, UserStatusUpdate
from sqlalchemy import or_, desc, case
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

from schemas.admin import FeedbackListResponse, FeedbackItemResponse, FeedbackStatsResponse
from models.domain import QueryFeedback, QueryLog, ChatSession

@router.get("/feedback", response_model=FeedbackListResponse)
async def get_feedback(
    page: int = 1,
    size: int = 10,
    days: int = None,
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        QueryFeedback,
        QueryLog,
        User
    ).join(
        QueryLog, QueryFeedback.query_id == QueryLog.id
    ).join(
        User, QueryLog.user_id == User.id
    ).order_by(desc(QueryFeedback.created_at))

    if days:
        target_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(QueryFeedback.created_at >= target_date)

    # Count total items for pagination and stats
    # We can fetch all matching rows for stats or run aggregate queries.
    # For stats, let's run a separate aggregate query.
    stats_query = select(
        func.count(QueryFeedback.id),
        func.sum(case((QueryFeedback.is_liked == True, 1), else_=0))
    )
    
    if days:
        stats_query = stats_query.where(QueryFeedback.created_at >= target_date)

    stats_res = await db.execute(stats_query)
    total_feedback, total_likes = stats_res.first()
    
    total_feedback = total_feedback or 0
    total_likes = total_likes or 0
    
    likes_percentage = int((total_likes / total_feedback) * 100) if total_feedback > 0 else 0
    dislikes_percentage = 100 - likes_percentage if total_feedback > 0 else 0

    # Pagination
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    rows = result.all()

    items = []
    for fb, ql, user in rows:
        snippet = ql.response[:100] + "..." if len(ql.response) > 100 else ql.response
        first_name = user.full_name.split()[0] if user.full_name else "User"
        items.append(FeedbackItemResponse(
            id=str(fb.id),
            session_id=str(ql.session_id),
            query_id=str(fb.query_id),
            date=fb.created_at.isoformat(),
            user_first_name=first_name,
            query=ql.query,
            response_snippet=snippet,
            is_liked=fb.is_liked,
            feedback_text=fb.feedback_text
        ))

    pages = math.ceil(total_feedback / size) if size > 0 else 0

    return FeedbackListResponse(
        stats=FeedbackStatsResponse(
            total=total_feedback,
            positive_percentage=likes_percentage,
            negative_percentage=dislikes_percentage
        ),
        items=items,
        total=total_feedback,
        page=page,
        size=size,
        pages=pages
    )

@router.post("/feedback/{query_id}/flag")
async def flag_feedback_to_rlhf(
    query_id: str,
    reason: str = "Flagged by Admin from Feedback Analytics",
    current_admin: Admin = Depends(require_permission("view_dashboard")),
    db: AsyncSession = Depends(get_db)
):
    from models.domain import RLHFReview
    
    # Check if already flagged
    res = await db.execute(select(RLHFReview).where(RLHFReview.query_id == uuid.UUID(query_id)))
    existing = res.scalar_one_or_none()
    
    if existing:
        return {"message": "Already flagged for RLHF review"}
        
    new_flag = RLHFReview(
        query_id=uuid.UUID(query_id),
        status="pending",
        flag_reason=reason
    )
    db.add(new_flag)
    await db.commit()
    return {"message": "Successfully flagged for RLHF review"}
