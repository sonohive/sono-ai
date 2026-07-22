import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from models.admin import Admin
from models import Base
from core.security import get_password_hash

def seed_admin():
    load_dotenv()
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
    if not SQLALCHEMY_DATABASE_URL:
        print("No DATABASE_URL")
        exit(1)

    # Use psycopg3 sync driver
    sync_url = SQLALCHEMY_DATABASE_URL.replace("+asyncpg", "+psycopg")
    engine = create_engine(sync_url)
    
    # 1. Create the new tables
    print("Creating new admin tables...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed the superadmin user
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == "admin@sono-ai.com").first()
        if existing_admin:
            print("Admin already exists. Updating password and permissions...")
            existing_admin.hashed_password = get_password_hash("password123")
            existing_admin.role = "superadmin"
            existing_admin.permissions = ["view_dashboard", "manage_kb", "review_rlhf", "invite_users"]
            db.commit()
            print("Admin updated successfully!")
        else:
            print("Creating superadmin user...")
            superadmin = Admin(
                email="admin@sono-ai.com",
                hashed_password=get_password_hash("password123"), # Default password
                full_name="Sono Superadmin",
                role="superadmin",
                permissions=["view_dashboard", "manage_kb", "review_rlhf", "invite_users"]
            )
            db.add(superadmin)
            db.commit()
            print("Superadmin created successfully! (Email: admin@sono-ai.com, Password: password123)")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
