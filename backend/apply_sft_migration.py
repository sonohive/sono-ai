import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from core.config import settings
from models.user import Base
import models

async def apply_migrations():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        # Create new tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Add columns to rlhf_reviews if they don't exist
        try:
            await conn.execute(text("ALTER TABLE rlhf_reviews ADD COLUMN retrained_data TEXT;"))
        except Exception as e:
            print("retrained_data already exists or error:", e)
            
        try:
            await conn.execute(text("ALTER TABLE rlhf_reviews ADD COLUMN grading_tags JSON;"))
        except Exception as e:
            print("grading_tags already exists or error:", e)
            
        try:
            await conn.execute(text("ALTER TABLE rlhf_reviews ADD COLUMN sft_reviewer_id UUID REFERENCES sft_reviewers(id);"))
        except Exception as e:
            print("sft_reviewer_id already exists or error:", e)
            
        try:
            await conn.execute(text("ALTER TABLE rlhf_reviews ADD COLUMN admin_id UUID REFERENCES admins(id);"))
        except Exception as e:
            print("admin_id already exists or error:", e)

    await engine.dispose()
    print("Migration applied!")

if __name__ == "__main__":
    asyncio.run(apply_migrations())
