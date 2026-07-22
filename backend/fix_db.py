import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    print("No DATABASE_URL")
    exit(1)

# Use psycopg3 sync driver
sync_url = SQLALCHEMY_DATABASE_URL.replace("+asyncpg", "+psycopg")
engine = create_engine(sync_url)

with engine.connect() as conn:
    try:
        # Add the session_id column
        conn.execute(text("ALTER TABLE query_logs ADD COLUMN session_id UUID;"))
        # Add the foreign key constraint
        conn.execute(text("ALTER TABLE query_logs ADD CONSTRAINT fk_query_logs_session_id FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;"))
        # (Optional) if there were existing rows, we would handle nulls here, but the table is empty so we can just alter it to NOT NULL
        conn.execute(text("ALTER TABLE query_logs ALTER COLUMN session_id SET NOT NULL;"))
        conn.commit()
        print("Database schema successfully patched!")
    except Exception as e:
        print(f"Error (you might have already patched it): {e}")
