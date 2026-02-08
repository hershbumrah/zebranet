# AI Assistant Chatbox Documentation

## Overview

The AI Assistant chatbox provides an intelligent, conversational interface for leagues and referees to:
- **Find and suggest referees** for games using natural language
- **Schedule games** and manage assignments automatically
- **Locate games** and view available opportunities
- **Auto-complete tasks** based on conversational requests

The assistant uses OpenAI's GPT-4 with function calling to understand user intent and take actions on their behalf.

## Features

- **Natural Language Understanding**: Ask questions in plain English
- **Context-Aware Responses**: AI understands your role (league/referee) and provides relevant suggestions
- **Function Calling**: AI can execute actions like searching for refs, creating games, and finding assignments
- **Conversation History**: Maintains context throughout the conversation
- **Role-Specific Tools**: Different capabilities for leagues vs referees
- **Suggested Prompts**: Example questions to get started

## Backend Components

### AI Chat Service
**File**: `app/services/ai_chat_service.py`

The `AIChatAssistant` class handles all AI interactions:
- **System Prompts**: Custom prompts based on user role (league/referee)
- **Tool Definitions**: Available functions for AI to call
- **Function Execution**: Handles AI function calls and returns results
- **Context Management**: Passes user profile data to AI for personalized responses

### Available AI Tools

#### For Leagues:
- `find_referees` - Find and suggest referees based on natural language criteria
- `create_game` - Schedule new games with location and details
- `search_games` - Search for games by date, location, or status
- `get_game_details` - Get detailed information about a specific game
 (AI Assistant)
Location: `src/frontend/src/components/ChatBox.tsx`

A floating AI assistant widget that appears in the bottom-right corner of both dashboards.

**Features:**
- Sparkles icon indicating AI capabilities
- Conversation history with AI
- Loading states during AI processing
- Suggested prompts to get started
- Clear conversation button
- Gradient styling to differentiate from regular UI
- Auto-scroll to latest message
- Enter to send, Shift+Enter for new line

### Integration
The AI ChatBox is integrated into:
- **RefereeDashboard** (`src/frontend/src/pages/RefereeDashboard.tsx`)
- **LeagueDashboard** (`src/frontend/src/pages/LeagueDashboard.tsx`)

## Example Conversations

### For League Managers:
**User**: "Find me a certified referee for next Saturday at 2pm"  
**AI**: "I'll search for certified referees available next Saturday at 2pm. [Searches database] I found 3 certified referees..."

**User**: "Schedule a U12 game at Lincoln Field for next weekend"  
**AI**: "I'll create a U12 game at Lincoln Field. [Creates game] Game created successfully for..."

### For Referees:
**User**: "What games are available near me this weekend?"  
**AI**: "Let me find games near your location this weekend. [Searches games] I found 5 games within 20km..."

**User**: "Show my upcoming assignments"  
**AI**: "Here are your upcoming assignments: [Lists assignments]"
}
```

Returns:
```json
{
  "response": "I found 3 certified referees available next Saturday...",
  "actions": [
    {
      "function": "find_referees",
      "arguments": {"query": "certified referee next Saturday"},
      "result": {...}
    }
  ],
  "function_calls": true
}
```

## Frontend Components

### ChatBox Component
Location: `src/frontend/src/components/ChatBox.tsx`

The ChatBox is a floating chat widget that appears in the bottom-right corner of both dashboards.

**Features:**
- Toggle open/close
- Unread badge indicator
- Conversation list view
- Individual conversation view
- Message input and send
- Auto-scroll to latest message
- Relative timestamps (e.g., "2h ago", "Just now")

### Integration
The ChatBox is integrated into:
- **RefereeDashboard** (`src/frontend/src/pages/RefereeDashboard.tsx`)
- **LeagueDashboard** (`src/frontend/src/pages/LeagueDashboard.tsx`)

## Database Schema

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    reciLeagues
1. Navigate to the League Dashboard
2. Click the sparkles icon in the bottom-right corner
3. Ask the AI assistant in natural language:
   - "Find me a referee for Friday night"
   - "Schedule a U15 game at Central Park"
   - "Show me all open games this week"
4. AI will understand your request and take appropriate actions

### For Referees
1. Navigate to the Referee Dashboard
2. Click the sparkles icon in the bottom-right corner
3. Ask the AI assistant:
   - "What games are available near me?"
   - "Show my assignments for next week"
   - "Find games this weekend"
4. AI provides personalized responses based on your profile

## Configuration

### OpenAI API Key
Set the `OPENAI_API_KEY` environment variable in your `.env` file:
```
OPENAI_API_KEY=sk-...
```

### AI Model
Currently uses `gpt-4o-mini` for cost-effectiveness. Can be changed in `ai_chat_service.py`.

## Future Enhancements

Potential improvements:
- Streaming responses for better UX
- Voice input/output
- Multi-step workflows (e.g., "Schedule 5 games for next month")
- Proactive suggestions ("You have an open game that matches referee X")
- Learning from user preferences
- Integration with calendar systems
- Email/SMS notifications for AI-suggested actions
- Bulk operations via AI commands
- Advanced analytics queries
- Export conversation history
1. Navigate to the League Dashboard
2. Click the message icon in the bottom-right corner
3. Select a referee from the conversation list (or wait for a referee to message you)
4. Type and send messages to discuss assignments and game details

## Future Enhancements

Potential improvements for the chat feature:
- WebSocket support for true real-time messaging (instead of polling)
- File/image attachments
- Message notifications (push/email)
- Group chats for team coordination
- Message search functionality
- Message editing and deletion
- Typing indicators
- Emoji support
- Message reactions
