from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt

from db.session import get_db
from core.config import settings
from core.security import decode_access_token
from models.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
        
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

from models.admin import Admin

async def get_current_admin(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> Admin:
    try:
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    result = await db.execute(select(Admin).where(Admin.id == user_id))
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Inactive admin")
        
    return admin

def require_permission(permission: str):
    def permission_checker(current_admin: Admin = Depends(get_current_admin)):
        if current_admin.role == "superadmin":
            return current_admin
        if permission not in current_admin.permissions:
            raise HTTPException(status_code=403, detail="Not enough privileges")
        return current_admin
    return permission_checker
