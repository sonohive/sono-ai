import asyncio
import json
import pymysql
import os

async def check_embeddings():
    wp_db_name = os.getenv("WP_DB_NAME", "sononwoc_ai")
    
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database=wp_db_name,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, knowledge_id, embedding FROM sa_sonoai_embeddings LIMIT 5")
        rows = cursor.fetchall()
        
        for row in rows:
            print(f"Checking chunk ID {row['id']}")
            emb = row['embedding']
            if isinstance(emb, bytes):
                emb = emb.decode('utf-8')
            
            try:
                vec = json.loads(emb)
                print(f"  - Parsed successfully. Type: {type(vec)}")
                if isinstance(vec, list):
                    print(f"  - Length: {len(vec)}")
            except Exception as e:
                print(f"  - Failed to parse JSON: {e}")
                
if __name__ == "__main__":
    asyncio.run(check_embeddings())
