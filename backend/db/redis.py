import redis.asyncio as redis
from core.config import settings

# Initialize Redis client
redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True # Returns string instead of bytes
)

async def get_redis():
    return redis_client
