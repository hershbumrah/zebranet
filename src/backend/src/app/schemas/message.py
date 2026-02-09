"""Message schemas for API requests and responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AIChatMessage(BaseModel):
    """Schema for AI chat message."""
    
    message: str = Field(..., min_length=1, max_length=5000, description="User message to AI")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        None, 
        description="Previous conversation messages for context"
    )


class AIChatResponse(BaseModel):
    """Schema for AI chat response."""
    
    response: str = Field(..., description="AI assistant's response")
    actions: List[Dict[str, Any]] = Field(default_factory=list, description="Actions performed by AI")
    function_calls: bool = Field(False, description="Whether AI made function calls")


class MessageBase(BaseModel):
    """Base message schema."""
    
    content: str = Field(..., min_length=1, max_length=5000, description="Message content")
    game_id: Optional[int] = Field(None, description="Optional game reference")


class MessageCreate(MessageBase):
    """Schema for creating a new message."""
    
    recipient_id: int = Field(..., description="User ID of the recipient")


class MessageUpdate(BaseModel):
    """Schema for updating a message (marking as read)."""
    
    is_read: bool = Field(..., description="Read status")


class MessageInDB(MessageBase):
    """Message schema as stored in database."""
    
    id: int
    sender_id: int
    recipient_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageResponse(MessageInDB):
    """Message response with sender/recipient details."""
    
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_name: Optional[str] = None


class ConversationParticipant(BaseModel):
    """Information about a conversation participant."""
    
    user_id: int
    email: str
    name: Optional[str] = None
    role: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True
