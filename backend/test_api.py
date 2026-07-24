import asyncio
from db.session import AsyncSessionLocal
from sqlalchemy.future import select
from sqlalchemy import or_
from models.domain import QueryLog, QueryFeedback, RLHFReview

async def run():
    async with AsyncSessionLocal() as db:
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
            pending.append({
                "id": str(log.id),
                "query": log.query,
                "response": log.response,
                "is_unanswered": log.is_unanswered,
                "is_liked": is_liked,
                "feedback_text": feedback_text,
                "created_at": log.created_at
            })
        print(f"Pending array length: {len(pending)}")

if __name__ == "__main__":
    asyncio.run(run())
