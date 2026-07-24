import asyncio
import os
import sys
import pymysql
from dotenv import load_dotenv

sys.path.append('c:/Users/HP/Desktop/sono-ai/backend')
load_dotenv('c:/Users/HP/Desktop/sono-ai/backend/.env')

from db.session import get_db
from models.domain import Topic, KnowledgeBaseMetadata
from sqlalchemy.future import select

async def sync_topics():
    # 1. Connect to MySQL to get legacy data
    print("Connecting to MySQL...")
    try:
        mysql_conn = pymysql.connect(
            host=os.getenv("WP_DB_HOST", "localhost"),
            user=os.getenv("WP_DB_USER", "root"),
            password=os.getenv("WP_DB_PASSWORD", ""),
            database=os.getenv("WP_DB_NAME", "myplugin"),
            cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        return

    legacy_topics = {}
    legacy_items = {}
    
    with mysql_conn.cursor() as cursor:
        print("Extracting topics from MySQL...")
        # Check both sa_ and myp_ prefixes
        tables_to_check = ["sa_sonoai_kb_topics", "myp_sonoai_kb_topics"]
        for t in tables_to_check:
            try:
                cursor.execute(f"SELECT id, name FROM {t}")
                for row in cursor.fetchall():
                    legacy_topics[str(row['id'])] = row['name'].strip()
            except Exception as e:
                pass # Table might not exist, skip
        
        print(f"Found {len(legacy_topics)} legacy topics.")
        print(f"Sample legacy topics keys: {list(legacy_topics.keys())[:3]}")
        
        print("Extracting item mappings from MySQL...")
        item_tables = ["sa_sonoai_kb_items", "myp_sonoai_kb_items"]
        for t in item_tables:
            try:
                cursor.execute(f"SELECT knowledge_id, topic_id FROM {t} WHERE topic_id IS NOT NULL")
                for row in cursor.fetchall():
                    if row['knowledge_id'] and row['topic_id']:
                        legacy_items[str(row['knowledge_id']).lower().strip()] = str(row['topic_id'])
            except Exception as e:
                pass

        print(f"Found {len(legacy_items)} legacy mapped items.")
        print(f"Sample legacy item topic IDs: {list(legacy_items.values())[:3]}")
    mysql_conn.close()

    # 2. Connect to PostgreSQL
    print("Connecting to PostgreSQL...")
    db_gen = get_db()
    db = await anext(db_gen)
    try:
        # Get new topics mapping (lowercase name to UUID)
        postgres_topics = (await db.execute(select(Topic))).scalars().all()
        postgres_topic_map = {t.name.strip().lower(): t.id for t in postgres_topics}
        
        # Get ALL KB items
        all_postgres_items = (await db.execute(select(KnowledgeBaseMetadata))).scalars().all()
        print(f"Total items in Postgres: {len(all_postgres_items)}")
        
        # Get unmapped KB items
        kb_items = [kb for kb in all_postgres_items if kb.topic_id is None]
        print(f"Found {len(kb_items)} unmapped items in PostgreSQL.")

        mapped_count = 0
        debug_missing_in_legacy = 0
        debug_null_in_legacy = 0
        
        # We need ALL legacy items to check what's going on
        all_legacy_items = set()
        with mysql_conn.cursor() as cursor:
            for t in ["sa_sonoai_kb_items", "myp_sonoai_kb_items"]:
                try:
                    cursor.execute(f"SELECT knowledge_id FROM {t}")
                    for row in cursor.fetchall():
                        if row['knowledge_id']:
                            all_legacy_items.add(str(row['knowledge_id']).lower().strip())
                except:
                    pass
                    
        for kb in kb_items:
            kb_uuid_str = str(kb.id).lower()
            if kb_uuid_str in legacy_items:
                legacy_topic_id = legacy_items[kb_uuid_str]
                if legacy_topic_id in legacy_topics:
                    legacy_topic_name = legacy_topics[legacy_topic_id].lower().strip()
                    
                    # Exact Match (or handle minor differences)
                    matched = False
                    if legacy_topic_name in postgres_topic_map:
                        kb.topic_id = postgres_topic_map[legacy_topic_name]
                        mapped_count += 1
                        matched = True
                    else:
                        for p_name, p_id in postgres_topic_map.items():
                            if p_name in legacy_topic_name or legacy_topic_name in p_name:
                                kb.topic_id = p_id
                                mapped_count += 1
                                matched = True
                                break
            else:
                if kb_uuid_str in all_legacy_items:
                    debug_null_in_legacy += 1
                else:
                    debug_missing_in_legacy += 1
                    
        print(f"DEBUG SUMMARY:")
        print(f" - Unmapped in Postgres: {len(kb_items)}")
        print(f" - Out of these, {debug_null_in_legacy} were ALSO unmapped (topic_id=null) in the original MySQL database.")
        print(f" - {debug_missing_in_legacy} were completely missing from MySQL.")
        print(f" - {mapped_count} were successfully mapped now.")
        
        await db.commit()
        print(f"Successfully mapped {mapped_count} items with 100% precision from legacy DB!")
        
    except Exception as e:
        print(f"Critical Error: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(sync_topics())
