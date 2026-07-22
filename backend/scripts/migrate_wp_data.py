import asyncio
import os
import pymysql
import uuid
from dotenv import load_dotenv
from sqlalchemy.future import select

# Load env before importing db
load_dotenv()

from db.session import SessionLocal
from models.user import User

async def migrate_users(mysql_conn):
    print("Migrating Users...")
    
    with mysql_conn.cursor() as cursor:
        # Assuming standard WordPress prefix 'wp_'
        # users table: wp_users, usermeta: wp_usermeta
        sql = "SELECT ID, user_login, user_email, user_pass, user_registered FROM wp_users"
        cursor.execute(sql)
        wp_users = cursor.fetchall()
        
    async with SessionLocal() as db:
        for wp_user in wp_users:
            wp_id = wp_user['ID']
            email = wp_user['user_email']
            username = wp_user['user_login']
            password_hash = wp_user['user_pass']
            
            # Check if user already exists
            result = await db.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()
            
            if not existing_user:
                new_user = User(
                    email=email,
                    hashed_password=password_hash, # We preserve the phpass hash!
                    full_name=username, # Can be enhanced by querying wp_usermeta
                    role="user"
                )
                db.add(new_user)
                
        await db.commit()
        print(f"Successfully migrated {len(wp_users)} users.")

async def migrate_trainings(mysql_conn):
    print("Migrating Custom Text Trainings and Topics...")
    
    with mysql_conn.cursor() as cursor:
        # TODO: Adjust 'post_type' to match whatever custom post type you used in WordPress
        # for your trainings (e.g., 'sono_training', 'kb_article', etc.)
        sql = "SELECT ID, post_title, post_content, post_date FROM wp_posts WHERE post_type = 'sono_training' AND post_status = 'publish'"
        cursor.execute(sql)
        wp_trainings = cursor.fetchall()
        
    async with SessionLocal() as db:
        for training in wp_trainings:
            # We insert these into our new KnowledgeBaseMetadata table
            # If the content contains raw text, we might want to push it directly to Redis
            # or save it as a text file in S3/R2 and store the URL here.
            pass
            
        # await db.commit()
        print(f"Found {len(wp_trainings)} custom trainings to migrate. (Pending exact post_type confirmation)")

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

    await migrate_users(mysql_conn)
    await migrate_trainings(mysql_conn)
    
    mysql_conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    # Fix for Windows asyncio
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
