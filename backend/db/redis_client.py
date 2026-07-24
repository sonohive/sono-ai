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

async def delete_from_redis_by_prefix(prefix: str):
    """Delete all keys matching a given prefix."""
    cursor = 0
    while True:
        cursor, keys = await redis_client.scan(cursor, match=f"{prefix}*", count=100)
        if keys:
            await redis_client.delete(*keys)
        if cursor == 0:
            break
