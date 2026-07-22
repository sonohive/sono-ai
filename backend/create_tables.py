import os
from sqlalchemy import create_engine
from models.user import Base
from models import domain
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    print("No DATABASE_URL")
    exit(1)

# Use psycopg3 sync driver for table creation script
sync_url = SQLALCHEMY_DATABASE_URL.replace("+asyncpg", "+psycopg")
# if psycopg isn't installed, it'll fallback to standard postgresql
engine = create_engine(sync_url)
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
