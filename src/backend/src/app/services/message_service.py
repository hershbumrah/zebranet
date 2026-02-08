"""Message service for handling chat operations."""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_, or_, select, func
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.user import User
from app.models.referee import RefereeProfile
from app.models.league import League
from app.schemas.message import MessageCreate, MessageResponse, ConversationParticipant


class MessageService:
    """Service for message/chat operations."""

    @staticmethod
    async def create_message(
        db: Session, sender_id: int, message_data: MessageCreate
    ) -> Message:
        """Create a new message."""
        message = Message(
            sender_id=sender_id,
            recipient_id=message_data.recipient_id,
            content=message_data.content,
            game_id=message_data.game_id,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    async def get_conversation(
        db: Session, user_id: int, other_user_id: int, skip: int = 0, limit: int = 50
    ) -> List[MessageResponse]:
        """Get all messages between two users."""
        stmt = (
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == user_id, Message.recipient_id == other_user_id),
                    and_(Message.sender_id == other_user_id, Message.recipient_id == user_id),
                )
            )
            .order_by(Message.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        messages = db.execute(stmt).scalars().all()
        
        # Enrich messages with user details
        return [
            await MessageService._enrich_message(db, msg) for msg in messages
        ]

    @staticmethod
    async def get_conversations_list(
        db: Session, user_id: int
    ) -> List[ConversationParticipant]:
        """Get list of all users that the current user has conversations with."""
        # Get all unique users that the current user has messaged or received messages from
        stmt = (
            select(User.id)
            .where(
                or_(
                    User.id.in_(
                        select(Message.recipient_id).where(Message.sender_id == user_id)
                    ),
                    User.id.in_(
                        select(Message.sender_id).where(Message.recipient_id == user_id)
                    ),
                )
            )
            .distinct()
        )
        user_ids = db.execute(stmt).scalars().all()
        
        participants = []
        for uid in user_ids:
            user = db.get(User, uid)
            if not user:
                continue
            
            # Get last message
            last_msg_stmt = (
                select(Message)
                .where(
                    or_(
                        and_(Message.sender_id == user_id, Message.recipient_id == uid),
                        and_(Message.sender_id == uid, Message.recipient_id == user_id),
                    )
                )
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg = db.execute(last_msg_stmt).scalar_one_or_none()
            
            # Count unread messages from this user
            unread_count_stmt = (
                select(func.count(Message.id))
                .where(
                    and_(
                        Message.sender_id == uid,
                        Message.recipient_id == user_id,
                        Message.is_read == False,
                    )
                )
            )
            unread_count = db.execute(unread_count_stmt).scalar() or 0
            
            # Get user's name based on role
            name = None
            if user.role == "ref":
                ref_profile = db.execute(
                    select(RefereeProfile).where(RefereeProfile.user_id == uid)
                ).scalar_one_or_none()
                if ref_profile:
                    name = ref_profile.full_name
            elif user.role == "league":
                league_profile = db.execute(
                    select(League).where(League.user_id == uid)
                ).scalar_one_or_none()
                if league_profile:
                    name = league_profile.name
            
            participants.append(
                ConversationParticipant(
                    user_id=uid,
                    email=user.email,
                    name=name,
                    role=user.role,
                    last_message=last_msg.content if last_msg else None,
                    last_message_at=last_msg.created_at if last_msg else None,
                    unread_count=unread_count,
                )
            )
        
        # Sort by last message time
        participants.sort(
            key=lambda p: p.last_message_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        return participants

    @staticmethod
    async def mark_as_read(db: Session, message_id: int, user_id: int) -> Optional[Message]:
        """Mark a message as read."""
        message = db.get(Message, message_id)
        if not message or message.recipient_id != user_id:
            return None
        
        message.is_read = True
        message.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    async def mark_conversation_as_read(
        db: Session, user_id: int, other_user_id: int
    ) -> int:
        """Mark all messages from other_user_id to user_id as read."""
        stmt = (
            select(Message)
            .where(
                and_(
                    Message.sender_id == other_user_id,
                    Message.recipient_id == user_id,
                    Message.is_read == False,
                )
            )
        )
        messages = db.execute(stmt).scalars().all()
        
        count = 0
        for msg in messages:
            msg.is_read = True
            msg.read_at = datetime.now(timezone.utc)
            count += 1
        
        if count > 0:
            db.commit()
        
        return count

    @staticmethod
    async def get_unread_count(db: Session, user_id: int) -> int:
        """Get total unread message count for a user."""
        stmt = select(func.count(Message.id)).where(
            and_(Message.recipient_id == user_id, Message.is_read == False)
        )
        return db.execute(stmt).scalar() or 0

    @staticmethod
    async def _enrich_message(db: Session, message: Message) -> MessageResponse:
        """Enrich message with sender/recipient details."""
        sender = db.get(User, message.sender_id)
        recipient = db.get(User, message.recipient_id)
        
        # Get sender name
        sender_name = None
        if sender and sender.role == "ref":
            ref_profile = db.execute(
                select(RefereeProfile).where(RefereeProfile.user_id == sender.id)
            ).scalar_one_or_none()
            if ref_profile:
                sender_name = ref_profile.full_name
        elif sender and sender.role == "league":
            league_profile = db.execute(
                select(League).where(League.user_id == sender.id)
            ).scalar_one_or_none()
            if league_profile:
                sender_name = league_profile.name
        
        # Get recipient name
        recipient_name = None
        if recipient and recipient.role == "ref":
            ref_profile = db.execute(
                select(RefereeProfile).where(RefereeProfile.user_id == recipient.id)
            ).scalar_one_or_none()
            if ref_profile:
                recipient_name = ref_profile.full_name
        elif recipient and recipient.role == "league":
            league_profile = db.execute(
                select(League).where(League.user_id == recipient.id)
            ).scalar_one_or_none()
            if league_profile:
                recipient_name = league_profile.name
        
        return MessageResponse(
            id=message.id,
            sender_id=message.sender_id,
            recipient_id=message.recipient_id,
            content=message.content,
            game_id=message.game_id,
            is_read=message.is_read,
            created_at=message.created_at,
            read_at=message.read_at,
            sender_email=sender.email if sender else None,
            sender_name=sender_name,
            recipient_email=recipient.email if recipient else None,
            recipient_name=recipient_name,
        )
