import asyncio
from db.session import AsyncSessionLocal
from sqlalchemy.future import select
from models.domain import QueryLog, QueryFeedback, RLHFReview

async def run():
    async with AsyncSessionLocal() as db:
        query = (
            select(QueryLog, QueryFeedback.is_liked, QueryFeedback.feedback_text)
            .outerjoin(QueryFeedback, QueryFeedback.query_id == QueryLog.id)
            .outerjoin(RLHFReview, RLHFReview.query_id == QueryLog.id)
            .where(
                (QueryLog.is_unanswered == True) | (QueryFeedback.is_liked == False)
            )
            .where(
                (RLHFReview.id == None) | (RLHFReview.status == 'pending')
            )
            .order_by(QueryLog.created_at.desc())
        )
        res = await db.execute(query)
        items = res.all()
        
        with open("queue_debug.txt", "w") as f:
            f.write(f"Count: {len(items)}\n")
            for item in items[:5]:
                f.write(f"{item[0].query} | {item[1]}\n")

if __name__ == "__main__":
    asyncio.run(run())
