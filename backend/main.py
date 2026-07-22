from fastapi import FastAPI
from api.router import router as api_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Sono AI API",
    description="Backend API for Sono AI Platform",
    version="1.0.0"
)

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
