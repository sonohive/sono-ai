from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as redis

from db.session import get_db
from db.redis import get_redis
from api.auth import router as auth_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["authentication"])

@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    status = {"status": "ok", "db": "unknown", "redis": "unknown"}
    
    # Test DB connection
    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            status["db"] = "connected"
    except Exception as e:
        status["db"] = f"error: {str(e)}"
        
    # Test Redis connection
    try:
        if await redis_client.ping():
            status["redis"] = "connected"
    except Exception as e:
        status["redis"] = f"error: {str(e)}"
        
    return status
