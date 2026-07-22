from langchain_community.chat_message_histories import RedisChatMessageHistory
from core.config import settings

def get_chat_history(session_id: str) -> RedisChatMessageHistory:
    """
    Retrieves the chat history for a given session ID backed by Redis.
    Uses the existing Redis connection URL.
    """
    return RedisChatMessageHistory(
        session_id=session_id,
        url=settings.REDIS_URL,
        key_prefix="sonoai:chat_history:"
    )
