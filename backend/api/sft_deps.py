from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt

from db.session import get_db
from core.security import decode_access_token
from models.sft_reviewer import SFTReviewer
from models.admin import Admin
from api.deps import reusable_oauth2, get_current_admin

async def get_current_sft_reviewer(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> SFTReviewer:
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
        
    result = await db.execute(select(SFTReviewer).where(SFTReviewer.id == user_id))
    reviewer = result.scalar_one_or_none()
    
    if not reviewer:
        raise HTTPException(status_code=401, detail="SFT Reviewer not found")
    if not reviewer.is_active:
        raise HTTPException(status_code=400, detail="Inactive reviewer")
        
    return reviewer

async def get_current_sft_or_admin(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
):
    """
    Returns either an Admin or an SFTReviewer object.
    Checks the SFTReviewer table first, then falls back to Admin table.
    """
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
        
    # Check SFTReviewer
    result_sft = await db.execute(select(SFTReviewer).where(SFTReviewer.id == user_id))
    sft = result_sft.scalar_one_or_none()
    
    if sft and sft.is_active:
        sft.is_sft_reviewer = True
        return sft
        
    # Check Admin
    result_admin = await db.execute(select(Admin).where(Admin.id == user_id))
    admin = result_admin.scalar_one_or_none()
    
    if admin and admin.is_active:
        admin.is_admin = True
        return admin
        
    raise HTTPException(status_code=401, detail="Not authorized for SFT Portal")
