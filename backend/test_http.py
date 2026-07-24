from fastapi.testclient import TestClient
from main import app
from models.admin import Admin
from db.session import AsyncSessionLocal
import asyncio
from core.security import create_access_token

async def test_endpoint():
    # We need an admin to generate a token
    async with AsyncSessionLocal() as db:
        from sqlalchemy.future import select
        result = await db.execute(select(Admin))
        admin = result.scalars().first()
        if not admin:
            print("No admin found!")
            return
            
        token = create_access_token({"sub": str(admin.id)})
        print(f"Generated token for {admin.email}")
        
    client = TestClient(app)
    response = client.get("/api/sft/queue/queries", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
