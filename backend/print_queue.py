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
        res = await db.execute(query)
        items = res.all()
        
        print(f"Total in queue: {len(items)}")
        
        # Check raw QueryLogs count that are unanswered
        raw_res = await db.execute(select(QueryLog).where(QueryLog.is_unanswered == True))
        print(f"Raw unanswered QueryLogs: {len(raw_res.scalars().all())}")

if __name__ == "__main__":
    asyncio.run(run())
