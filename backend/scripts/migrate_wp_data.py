import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pymysql
import uuid
import json
from dotenv import load_dotenv
from sqlalchemy.future import select
from sqlalchemy import text

# Load env before importing db
load_dotenv()

from db.session import AsyncSessionLocal, engine
from models.user import User, Base
from models.domain import Topic, KnowledgeBaseMetadata, QueryLog, SavedResponse, KnowledgeBaseEmbedding

async def truncate_tables():
    print("Truncating old Postgres tables...")
    async with AsyncSessionLocal() as db:
        await db.execute(text("TRUNCATE TABLE kb_embeddings CASCADE"))
        await db.execute(text("TRUNCATE TABLE kb_metadata CASCADE"))
        await db.commit()

async def migrate_custom_tables(mysql_conn):
    print("Migrating SonoAI KB Items...")
    
    async with AsyncSessionLocal() as db:
        with mysql_conn.cursor() as cursor:
            # 2. Migrate KB Items
            cursor.execute("SELECT knowledge_id, source_title, source_url, type, mode, topic_id, country, created_at FROM sa_sonoai_kb_items")
            wp_kb = cursor.fetchall()
            for kb in wp_kb:
                try:
                    kb_uuid = uuid.UUID(kb['knowledge_id'])
                except:
                    kb_uuid = uuid.uuid4()
                    
                # map type to training_type
                t_type = kb['type']
                if t_type == 'wp' or t_type == 'custom_text':
                    t_type = 'text'
                elif t_type == 'pdf':
                    t_type = 'pdf'
                elif t_type == 'url' or t_type == 'website':
                    t_type = 'url'
                    
                new_kb = KnowledgeBaseMetadata(
                    id=kb_uuid,
                    source_url=kb['source_url'] or '',
                    training_type=t_type,
                    mode=kb['mode'] or 'guideline',
                    country=kb['country'] or '',
                    topic_id=None,
                    source_name=kb['source_title'] or 'Legacy Source',
                    created_at=kb['created_at']
                )
                db.add(new_kb)
            
        await db.commit()
        print(f"Successfully migrated {len(wp_kb)} Knowledge Base Items.")

async def migrate_embeddings(mysql_conn):
    print("Migrating Chunks and Upgrading Embeddings to text-embedding-3-large...")
    
    # Setup OpenAI embeddings for re-embedding
    from core.config import settings
    from langchain_openai import OpenAIEmbeddings
    embeddings = OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        openai_api_key=settings.OPENAI_API_KEY
    )
    
    with mysql_conn.cursor() as cursor:
        cursor.execute("SELECT id, knowledge_id, chunk_text FROM sa_sonoai_embeddings")
        wp_embeddings = cursor.fetchall()
        
    print(f"Found {len(wp_embeddings)} embedded chunks in MySQL. Re-embedding with {settings.EMBEDDING_MODEL}...")
    
    success_count = 0
    error_count = 0
    
    async with AsyncSessionLocal() as db:
        # Group chunks by batches to speed up if needed, but sequential is safer for error handling
        for idx, chunk in enumerate(wp_embeddings):
            if idx % 50 == 0:
                print(f"Processed {idx}/{len(wp_embeddings)} chunks...")
                
            chunk_text = chunk['chunk_text']
            if not chunk_text:
                error_count += 1
                continue
                
            try:
                # Re-embed using 3-large
                embedding_vector = await embeddings.aembed_query(chunk_text)
            except Exception as e:
                print(f"Failed to call OpenAI for chunk id {chunk['id']}: {e}")
                error_count += 1
                continue
                
            try:
                k_id = uuid.UUID(chunk['knowledge_id'])
            except:
                k_id = None
                
            new_embedding = KnowledgeBaseEmbedding(
                knowledge_id=k_id,
                chunk_text=chunk_text,
                embedding=embedding_vector
            )
            db.add(new_embedding)
            
            try:
                await db.commit()
                success_count += 1
            except Exception as e:
                print(f"Failed to commit chunk id {chunk['id']}: {e}")
                await db.rollback()
                error_count += 1
                
    print(f"Migration complete! Upgraded and Inserted {success_count} chunks. Skipped {error_count} due to errors.")

async def main():
    wp_db_host = os.getenv("WP_DB_HOST", "localhost")
    wp_db_user = os.getenv("WP_DB_USER", "root")
    wp_db_pass = os.getenv("WP_DB_PASSWORD", "")
    wp_db_name = os.getenv("WP_DB_NAME", "wordpress")
    
    print(f"Connecting to WordPress MySQL Database: {wp_db_name} at {wp_db_host}...")
    try:
        mysql_conn = pymysql.connect(
            host=wp_db_host,
            user=wp_db_user,
            password=wp_db_pass,
            database=wp_db_name,
            cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        return

    # Ensure Postgres tables and extensions exist
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        
    await truncate_tables()
    await migrate_custom_tables(mysql_conn)
    await migrate_embeddings(mysql_conn)
    
    mysql_conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
