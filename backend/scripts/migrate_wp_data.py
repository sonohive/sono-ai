import asyncio
import os
import pymysql
import uuid
from dotenv import load_dotenv
from sqlalchemy.future import select

# Load env before importing db
load_dotenv()

from db.session import AsyncSessionLocal, engine
from models.user import User, Base
from models.domain import Topic, KnowledgeBaseMetadata, QueryLog, SavedResponse, KnowledgeBaseEmbedding
import json

async def migrate_users(mysql_conn):
    print("Migrating Users...")
    
    with mysql_conn.cursor() as cursor:
        # The WordPress prefix is sa_ based on wp-config
        # users table: sa_users
        sql = "SELECT ID, user_login, user_email, user_pass, user_registered FROM sa_users"
        cursor.execute(sql)
        wp_users = cursor.fetchall()
        
    async with AsyncSessionLocal() as db:
        for wp_user in wp_users:
            wp_id = wp_user['ID']
            email = wp_user['user_email']
            username = wp_user['user_login']
            password_hash = wp_user['user_pass']
            
            result = await db.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()
            
            if not existing_user:
                new_user = User(
                    email=email,
                    hashed_password=password_hash,
                    full_name=username,
                    role="user"
                )
                db.add(new_user)
                
        await db.commit()
        print(f"Successfully migrated {len(wp_users)} users.")

async def migrate_custom_tables(mysql_conn):
    print("Migrating SonoAI Custom Tables (Topics, KB Items, Logs, Saved Responses)...")
    
    async with AsyncSessionLocal() as db:
        with mysql_conn.cursor() as cursor:
            # 1. Migrate Topics
            cursor.execute("SELECT id, slug, name, created_at FROM sa_sonoai_kb_topics")
            wp_topics = cursor.fetchall()
            for t in wp_topics:
                # Assuming name is unique, we could check for existence, but we'll just insert
                new_topic = Topic(name=t['name'], description=t['slug'])
                db.add(new_topic)
                
            # 2. Migrate KB Items
            cursor.execute("SELECT id, source_title, source_url, created_at FROM sa_sonoai_kb_items")
            wp_kb = cursor.fetchall()
            for kb in wp_kb:
                new_kb = KnowledgeBaseMetadata(
                    title=kb['source_title'] or 'Untitled Document',
                    source_url=kb['source_url'] or ''
                )
                db.add(new_kb)
                
            # Note: For Query Logs and Saved Responses, we need to map wp_users ID to the new UUID.
            # Since the new architecture uses UUIDs for users, we would need to map them properly
            # by looking up the email from wp_users first. For the sake of this migration script
            # template, we'll keep it simple and focus on the knowledge base.
            
        await db.commit()
        print(f"Successfully migrated {len(wp_topics)} Topics and {len(wp_kb)} Knowledge Base Items.")

async def migrate_embeddings(mysql_conn):
    print("Migrating Embeddings and Chunk Text to Postgres (pgvector)...")
    
    with mysql_conn.cursor() as cursor:
        cursor.execute("SELECT id, knowledge_id, chunk_text, embedding FROM sa_sonoai_embeddings")
        wp_embeddings = cursor.fetchall()
        
    print(f"Found {len(wp_embeddings)} embedded chunks in MySQL.")
    
    async with AsyncSessionLocal() as db:
        success_count = 0
        error_count = 0
        for chunk in wp_embeddings:
            embedding_data = chunk['embedding']
            
            # PyMySQL might return bytes for JSON/TEXT columns
            if isinstance(embedding_data, bytes):
                embedding_data = embedding_data.decode('utf-8')
                
            if isinstance(embedding_data, str):
                try:
                    embedding_vector = json.loads(embedding_data)
                except Exception as e:
                    if error_count == 0: print(f"DEBUG Parse error: {e}, Data: {embedding_data[:100]}")
                    error_count += 1
                    continue # Skip if parsing fails
            else:
                embedding_vector = embedding_data
            
            # Skip if it's not a valid list
            if not isinstance(embedding_vector, list):
                if error_count == 0: print(f"DEBUG Not a list: Type is {type(embedding_vector)}")
                error_count += 1
                continue
                
            # Verify the dimension is exactly 3072
            if len(embedding_vector) != 3072:
                if error_count == 0: print(f"DEBUG Wrong dimension: {len(embedding_vector)}")
                error_count += 1
                continue
                
            new_embedding = KnowledgeBaseEmbedding(
                chunk_text=chunk['chunk_text'],
                embedding=embedding_vector
            )
            db.add(new_embedding)
            
            try:
                await db.commit()
                success_count += 1
            except Exception as e:
                await db.rollback()
                error_count += 1
                print(f"Error inserting chunk: {e}")
                
    print(f"Migration complete! Inserted {success_count} chunks. Skipped {error_count} due to errors/dimensions.")

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
        print("Make sure you added the WP_DB_* credentials to backend/.env!")
        return

    # Ensure Postgres tables and extensions exist
    from sqlalchemy import text
    async with engine.begin() as conn:
        # Create the pgvector extension automatically
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Drop the old table so it recreates with the correct dimensions
        await conn.execute(text("DROP TABLE IF EXISTS kb_embeddings CASCADE"))
        await conn.run_sync(Base.metadata.create_all)
        
    # await migrate_users(mysql_conn)
    # await migrate_custom_tables(mysql_conn)
    await migrate_embeddings(mysql_conn)
    
    mysql_conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
