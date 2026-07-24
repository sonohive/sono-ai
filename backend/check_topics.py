import asyncio
import os
import sys

sys.path.append('c:/Users/HP/Desktop/sono-ai/backend')

from db.session import get_db
from sqlalchemy import text

async def check():
    db_gen = get_db()
    db = await anext(db_gen)
    try:
        res = await db.execute(text('SELECT count(*), count(topic_id) FROM kb_metadata'))
        counts = res.all()
        with open('output.txt', 'w') as f:
            f.write(f"Total rows: {counts[0][0]}, Rows with topic_id: {counts[0][1]}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check())
