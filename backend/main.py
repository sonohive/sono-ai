from fastapi import FastAPI
from api.router import router as api_router
from fastapi.middleware.cors import CORSMiddleware
from db.session import engine
from sqlalchemy import text

app = FastAPI(
    title="Sono AI API",
    description="Backend API for Sono AI Platform",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    # Attempt to add is_unanswered column to query_logs if it doesn't exist
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE query_logs ADD COLUMN IF NOT EXISTS is_unanswered BOOLEAN DEFAULT FALSE;"))
            print("Successfully checked/added is_unanswered column.")
    except Exception as e:
        print(f"Column is_unanswered likely already exists: {e}")

    try:
        async with engine.begin() as conn:
            await conn.execute(text("UPDATE kb_metadata SET training_type = 'text' WHERE training_type = 'txt' OR training_type = 'wp' OR training_type = 'custom_text';"))
            print("Successfully updated old training types.")
    except Exception as e:
        print(f"Error updating training types: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Sono AI API. Visit /docs for documentation."}
