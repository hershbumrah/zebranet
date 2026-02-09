"""Message/chat routes."""

from typing import Dict, List, Set

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, get_current_user
from app.core.security import decode_access_token
from app.models.user import User
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessageUpdate,
    ConversationParticipant,
    AIChatMessage,
    AIChatResponse,
)
from app.services.message_service import MessageService
from app.services.ai_chat_service import AIChatAssistant

router = APIRouter()


class InboxConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        self.active_connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def notify_unread(self, user_id: int, unread_count: int) -> None:
        if user_id not in self.active_connections:
            return
        dead: Set[WebSocket] = set()
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_json({"type": "unread", "unread_count": unread_count})
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(user_id, ws)


inbox_manager = InboxConnectionManager()


@router.post("/ai-chat", response_model=AIChatResponse)
async def ai_chat(
    chat_message: AIChatMessage,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> AIChatResponse:
    """Chat with AI assistant for scheduling, finding refs, and game management."""
    result = await AIChatAssistant.chat(
        db=db,
        user_id=current_user.id,
        user_role=current_user.role,
        message=chat_message.message,
        conversation_history=chat_message.conversation_history,
    )
    
    return AIChatResponse(**result)


@router.websocket("/ws/inbox")
async def inbox_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db_dep),
) -> None:
    await websocket.accept()

    try:
        payload = decode_access_token(token)
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid token"})
        await websocket.close(code=1008)
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.send_json({"type": "error", "message": "Invalid token"})
        await websocket.close(code=1008)
        return

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        await websocket.send_json({"type": "error", "message": "User not found"})
        await websocket.close(code=1008)
        return

    await inbox_manager.connect(int(user_id), websocket)
    try:
        unread = await MessageService.get_unread_count(db, int(user_id))
        await inbox_manager.notify_unread(int(user_id), unread)

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        inbox_manager.disconnect(int(user_id), websocket)


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Send a new message to another user."""
    # Verify recipient exists
    recipient = db.get(User, message_data.recipient_id)
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found",
        )
    
    # Create message
    message = await MessageService.create_message(db, current_user.id, message_data)
    
    # Return enriched message and notify recipient
    response = await MessageService._enrich_message(db, message)
    unread_count = await MessageService.get_unread_count(db, message_data.recipient_id)
    await inbox_manager.notify_unread(message_data.recipient_id, unread_count)
    return response


@router.get("/conversations", response_model=List[ConversationParticipant])
async def get_conversations(
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> List[ConversationParticipant]:
    """Get list of all conversations (users with message history)."""
    return await MessageService.get_conversations_list(db, current_user.id)


@router.get("/conversation/{other_user_id}", response_model=List[MessageResponse])
async def get_conversation(
    other_user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> List[MessageResponse]:
    """Get all messages with a specific user."""
    # Verify other user exists
    other_user = db.get(User, other_user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return await MessageService.get_conversation(
        db, current_user.id, other_user_id, skip, limit
    )


@router.patch("/{message_id}/read", response_model=MessageResponse)
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Mark a specific message as read."""
    message = await MessageService.mark_as_read(db, message_id, current_user.id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or you are not the recipient",
        )
    
    return await MessageService._enrich_message(db, message)


@router.post("/conversation/{other_user_id}/mark-read")
async def mark_conversation_read(
    other_user_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Mark all messages from a user as read."""
    count = await MessageService.mark_conversation_as_read(
        db, current_user.id, other_user_id
    )
    return {"marked_read": count}


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get total unread message count."""
    count = await MessageService.get_unread_count(db, current_user.id)
    return {"unread_count": count}
