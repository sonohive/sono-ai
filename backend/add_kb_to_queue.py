import asyncio
import uuid
from sqlalchemy.future import select
from db.session import AsyncSessionLocal
from models.domain import KnowledgeBaseMetadata, QueryLog, ChatSession
from models.user import User
from models.admin import Admin

async def main():
    async with AsyncSessionLocal() as db:
        # 1. Get an existing user and session to attach the query logs to
        # Since it's an admin task, let's see if there's a user we can use
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalar_one_or_none()
        
        if not user:
            print("No users found in database to attach the queue items to.")
            return

        session_res = await db.execute(select(ChatSession).where(ChatSession.user_id == user.id).limit(1))
        chat_session = session_res.scalar_one_or_none()
        
        if not chat_session:
            # Create a dummy session
            chat_session = ChatSession(user_id=user.id, title="KB Review Session", mode="guideline")
            db.add(chat_session)
            await db.flush()
            
        # 2. Get all KB items
        kb_res = await db.execute(select(KnowledgeBaseMetadata))
        kb_items = kb_res.scalars().all()
        
        print(f"Found {len(kb_items)} KB items.")
        
        # 3. Create a query log for each
        for kb in kb_items:
            # Check if this KB is already in the queue to prevent duplicates
            query_text = f"[KB Review] {kb.source_name}"
            existing = await db.execute(select(QueryLog).where(QueryLog.query == query_text))
            if existing.scalar_one_or_none():
                continue
                
            content = kb.description or kb.source_url or "No content available."
            
            ql = QueryLog(
                user_id=user.id,
                session_id=chat_session.id,
                query=query_text,
                response=content,
                is_unanswered=True # Triggers it to show up in SFT Queue
            )
            db.add(ql)
            
        await db.commit()
        print(f"Successfully added KB items to the SFT Queue.")

if __name__ == "__main__":
    asyncio.run(main())
