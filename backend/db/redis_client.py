import redis.asyncio as redis
from core.config import settings
import json

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def store_in_redis(key: str, vector: list[float], metadata: dict):
    """Store a vector and metadata in Redis."""
    mapping = {
        "vector": json.dumps(vector),
        "metadata": json.dumps(metadata)
    }
    await redis_client.hset(key, mapping=mapping)
