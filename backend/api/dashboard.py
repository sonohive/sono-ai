from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from db.session import get_db
from models.user import User
from models.domain import QueryLog, SavedResponse
from api.deps import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user-specific dashboard statistics.
    """
    # Count recent chats/queries
    query_count = await db.execute(
        select(func.count(QueryLog.id)).where(QueryLog.user_id == current_user.id)
    )
    total_chats = query_count.scalar_one()

    # Count flashcards (saved responses)
    flashcard_count = await db.execute(
        select(func.count(SavedResponse.id)).where(SavedResponse.user_id == current_user.id)
    )
    total_flashcards = flashcard_count.scalar_one()

    return {
        "recent_chats_count": total_chats,
        "flashcards_count": total_flashcards,
        "offline_materials_count": 0 # Can be expanded later
    }
