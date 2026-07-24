import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv('backend/.env')

from db.session import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(text("UPDATE kb_metadata SET training_type = 'text' WHERE training_type = 'txt'"))
        await db.execute(text("UPDATE kb_metadata SET training_type = 'media' WHERE training_type = 'image'"))
        await db.commit()
        res = await db.execute(text("SELECT training_type, count(*) FROM kb_metadata GROUP BY training_type"))
        print(res.fetchall())

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
