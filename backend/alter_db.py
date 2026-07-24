import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL="postgresql+asyncpg://postgres:fZiLiIpASmlpZkmmnLOxOyoPwtHqdYCt@sakura.proxy.rlwy.net:14034/railway"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE query_logs ADD COLUMN IF NOT EXISTS is_unanswered BOOLEAN DEFAULT FALSE;"))
        print("Column added successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
