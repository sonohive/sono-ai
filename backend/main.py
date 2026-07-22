from fastapi import FastAPI
from api.router import router as api_router

app = FastAPI(
    title="Sono AI API",
    description="Backend API for Sono AI Platform",
    version="1.0.0"
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Sono AI API. Visit /docs for documentation."}
