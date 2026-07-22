from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from core.config import settings

# Create async engine for PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True, # Set to False in production
)

# Async session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)

# Dependency to yield database sessions
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
