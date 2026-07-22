from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from db.session import get_db
from models.user import User
from models.domain import SavedResponse, ChatSession
from schemas.saved_response import SavedResponseCreate, SavedResponseItem
from api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=SavedResponseItem)
async def create_saved_response(
    data: SavedResponseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify the session belongs to the user
    session_result = await db.execute(select(ChatSession).where(ChatSession.id == data.session_id, ChatSession.user_id == current_user.id))
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not owned by user")

    new_response = SavedResponse(
        user_id=current_user.id,
        session_id=data.session_id,
        question=data.question,
        answer=data.answer
    )
    db.add(new_response)
    await db.commit()
    await db.refresh(new_response)
    
    # Attach mode for response schema
    response_dict = new_response.__dict__
    response_dict["mode"] = session.mode
    
    return response_dict

@router.get("/", response_model=list[SavedResponseItem])
async def list_saved_responses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SavedResponse, ChatSession.mode)
        .join(ChatSession, SavedResponse.session_id == ChatSession.id)
        .where(SavedResponse.user_id == current_user.id)
        .order_by(SavedResponse.created_at.desc())
    )
    
    items = []
    for row in result:
        saved_resp, mode = row
        resp_dict = saved_resp.__dict__
        resp_dict["mode"] = mode
        items.append(resp_dict)
        
    return items

@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_response(
    response_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SavedResponse)
        .where(SavedResponse.id == response_id, SavedResponse.user_id == current_user.id)
    )
    response_item = result.scalar_one_or_none()
    if not response_item:
        raise HTTPException(status_code=404, detail="Saved response not found")
        
    await db.delete(response_item)
    await db.commit()
