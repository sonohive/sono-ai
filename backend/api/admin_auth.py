from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta, datetime
import uuid
import secrets

from db.session import get_db
from models.admin import Admin, AdminInvitation
from schemas.admin_user import AdminResponse, InviteRequest, InviteResponse, AcceptInviteRequest, AdminToken
from core.security import get_password_hash, verify_password, create_access_token
from core.config import settings
from api.deps import get_current_admin, require_permission

router = APIRouter()

@router.post("/login", response_model=AdminToken)
async def login(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    result = await db.execute(select(Admin).where(Admin.email == form_data.username))
    admin = result.scalar_one_or_none()
    
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    elif not admin.is_active:
        raise HTTPException(status_code=400, detail="Inactive admin account")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=admin.id, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=AdminResponse)
async def get_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin

@router.post("/invite", response_model=InviteResponse)
async def invite_admin(
    invite_req: InviteRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(require_permission("invite_users"))
):
    # Check if admin already exists
    result = await db.execute(select(Admin).where(Admin.email == invite_req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Admin already exists")
        
    # Generate token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    invitation = AdminInvitation(
        email=invite_req.email,
        role=invite_req.role,
        permissions=invite_req.permissions,
        token=token,
        expires_at=expires_at,
        created_by_id=current_admin.id
    )
    db.add(invitation)
    await db.commit()
    
    # In a real app, send an email here with the token
    # send_email(invite_req.email, token)
    
    return InviteResponse(
        message="Invitation created successfully",
        invite_url=f"http://localhost:5174/invite/{token}"
    )

@router.post("/accept-invite")
async def accept_invite(
    accept_req: AcceptInviteRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AdminInvitation)
        .where(AdminInvitation.token == accept_req.token)
        .where(AdminInvitation.expires_at > datetime.utcnow())
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation token")
        
    # Create the admin
    admin = Admin(
        email=invitation.email,
        hashed_password=get_password_hash(accept_req.password),
        full_name=accept_req.full_name,
        role=invitation.role,
        permissions=invitation.permissions
    )
    db.add(admin)
    
    # Remove invitation
    await db.delete(invitation)
    await db.commit()
    
    return {"message": "Admin account created successfully. You can now log in."}
