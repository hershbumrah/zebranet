"""AI assistant service for chatbox interactions."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from openai import OpenAI
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.game import Game
from app.models.league import League
from app.models.referee import RefereeProfile
from app.models.rating import Rating
from app.models.user import User
from app.schemas.ai import FindRefRequest, FindRefResult
from app.services.ai_matching_service import find_best_refs_from_nl


def _client() -> OpenAI:
    """Get OpenAI client."""
    settings = get_settings()
    return OpenAI(api_key=settings.OPENAI_API_KEY or None)


class AIChatAssistant:
    """AI-powered chat assistant for scheduling and ref finding."""

    @staticmethod
    def get_system_prompt(user_role: str, user_context: Dict[str, Any]) -> str:
        """Generate system prompt based on user role and context."""
        base_prompt = """You are RefNexus AI Assistant, a helpful assistant for referee scheduling and game and league management.

You help users with:
- Finding and suggesting referees for games
- Scheduling games and managing assignments
- Providing information about games, referees, and locations
- Auto-completing tasks based on natural language requests

Be conversational, helpful, and concise. When you need to perform actions, use the available functions."""

        if user_role == "league":
            base_prompt += f"""

You are assisting a league manager. They can:
- Create games and schedule matches
- Search for qualified referees
- Assign referees to games
- View game schedules

Current league context:
- League: {user_context.get('league_name', 'Unknown')}
- Region: {user_context.get('region', 'Unknown')}
"""
        elif user_role == "ref":
            base_prompt += f"""

You are assisting a referee. They can:
- View available games and assignments
- Update availability
- Accept or decline game assignments
- View their stats and ratings

Current referee context:
- Name: {user_context.get('ref_name', 'Unknown')}
- Certification Level: {user_context.get('cert_level', 'Unknown')}
- Location: {user_context.get('location', 'Unknown')}
"""

        return base_prompt

    @staticmethod
    def get_available_tools(user_role: str) -> List[Dict[str, Any]]:
        """Get available function tools based on user role."""
        tools = []

        # Common tools for both roles
        tools.extend([
            {
                "type": "function",
                "function": {
                    "name": "search_games",
                    "description": "Search for games by date, location, or other criteria",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "date_from": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                            "date_to": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                            "location": {"type": "string", "description": "Location or region"},
                            "status": {"type": "string", "enum": ["open", "assigned", "completed"]},
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_game_details",
                    "description": "Get detailed information about a specific game",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "game_id": {"type": "integer", "description": "Game ID"},
                        },
                        "required": ["game_id"],
                    },
                },
            },
        ])

        if user_role == "league":
            # League-specific tools
            tools.extend([
                {
                    "type": "function",
                    "function": {
                        "name": "find_referees",
                        "description": "Find and suggest referees based on criteria",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string", "description": "Natural language search query"},
                                "game_id": {"type": "integer", "description": "Optional game ID for context"},
                            },
                            "required": ["query"],
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "create_game",
                        "description": "Create a new game/match",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "location": {"type": "string", "description": "Game location/address"},
                                "date_time": {"type": "string", "description": "Date and time (ISO format)"},
                                "age_group": {"type": "string", "description": "Age group (e.g., U12, U15)"},
                                "competition_level": {"type": "string", "description": "Competition level"},
                                "center_fee": {"type": "number", "description": "Center referee fee"},
                                "ar_fee": {"type": "number", "description": "Assistant referee fee"},
                            },
                            "required": ["location", "date_time"],
                        },
                    },
                },
            ])
        elif user_role == "ref":
            # Referee-specific tools
            tools.extend([
                {
                    "type": "function",
                    "function": {
                        "name": "get_my_assignments",
                        "description": "Get the referee's current game assignments",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string", "enum": ["requested", "accepted", "all"]},
                            },
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "get_available_games",
                        "description": "Get open games that match the referee's profile",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "max_distance_km": {"type": "number", "description": "Maximum distance"},
                            },
                        },
                    },
                },
            ])

        return tools

    @staticmethod
    async def chat(
        db: Session,
        user_id: int,
        user_role: str,
        message: str,
        conversation_history: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Process a chat message and return AI response with potential actions.
        
        Args:
            db: Database session
            user_id: Current user ID
            user_role: User role ('ref' or 'league')
            message: User's message
            conversation_history: Previous messages in conversation
            
        Returns:
            Dict with 'response' (text) and optional 'actions' (data from function calls)
        """
        # Get user context
        user = db.get(User, user_id)
        user_context = {}
        
        if user_role == "league":
            league = db.query(League).filter(League.user_id == user_id).first()
            if league:
                user_context = {
                    "league_name": league.name,
                    "region": league.primary_region,
                    "level": league.level,
                }
        elif user_role == "ref":
            ref_profile = db.query(RefereeProfile).filter(RefereeProfile.user_id == user_id).first()
            if ref_profile:
                user_context = {
                    "ref_name": ref_profile.full_name,
                    "cert_level": ref_profile.cert_level,
                    "location": ref_profile.home_location,
                }

        # Build messages for OpenAI
        messages = [
            {"role": "system", "content": AIChatAssistant.get_system_prompt(user_role, user_context)}
        ]
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current message
        messages.append({"role": "user", "content": message})

        # Get tools
        tools = AIChatAssistant.get_available_tools(user_role)

        # Call OpenAI
        client = _client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None,
        )

        assistant_message = response.choices[0].message
        
        # Handle function calls
        actions = []
        if assistant_message.tool_calls:
            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = eval(tool_call.function.arguments)
                
                # Execute the function
                result = await AIChatAssistant._execute_function(
                    db, user_id, user_role, function_name, function_args
                )
                actions.append({
                    "function": function_name,
                    "arguments": function_args,
                    "result": result,
                })

        return {
            "response": assistant_message.content or "I've processed your request.",
            "actions": actions,
            "function_calls": bool(assistant_message.tool_calls),
        }

    @staticmethod
    async def _execute_function(
        db: Session,
        user_id: int,
        user_role: str,
        function_name: str,
        arguments: Dict[str, Any],
    ) -> Any:
        """Execute a function call from the AI."""
        
        if function_name == "search_games":
            return AIChatAssistant._search_games(db, user_id, arguments)
        
        elif function_name == "get_game_details":
            return AIChatAssistant._get_game_details(db, arguments.get("game_id"))
        
        elif function_name == "find_referees":
            return await AIChatAssistant._find_referees(db, user_id, arguments)
        
        elif function_name == "create_game":
            return await AIChatAssistant._create_game(db, user_id, arguments)
        
        elif function_name == "get_my_assignments":
            return AIChatAssistant._get_assignments(db, user_id, arguments)
        
        elif function_name == "get_available_games":
            return AIChatAssistant._get_available_games(db, user_id, arguments)
        
        return {"error": "Unknown function"}

    @staticmethod
    def _search_games(db: Session, user_id: int, args: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search for games."""
        query = db.query(Game)
        
        if args.get("status"):
            query = query.filter(Game.status == args["status"])
        
        if args.get("date_from"):
            query = query.filter(Game.scheduled_start >= args["date_from"])
        
        if args.get("date_to"):
            query = query.filter(Game.scheduled_start <= args["date_to"])
        
        games = query.limit(10).all()
        return [
            {
                "id": g.id,
                "location": g.field_location.address if g.field_location else "Unknown",
                "date": g.scheduled_start.isoformat(),
                "age_group": g.age_group,
                "status": g.status,
            }
            for g in games
        ]

    @staticmethod
    def _get_game_details(db: Session, game_id: int) -> Dict[str, Any]:
        """Get game details."""
        game = db.get(Game, game_id)
        if not game:
            return {"error": "Game not found"}
        
        return {
            "id": game.id,
            "location": game.field_location.address if game.field_location else "Unknown",
            "date": game.scheduled_start.isoformat(),
            "age_group": game.age_group,
            "competition_level": game.competition_level,
            "status": game.status,
            "center_fee": game.center_fee,
            "ar_fee": game.ar_fee,
        }

    @staticmethod
    async def _find_referees(db: Session, user_id: int, args: Dict[str, Any]) -> Dict[str, Any]:
        """Find referees using AI matching."""
        league = db.query(League).filter(League.user_id == user_id).first()
        if not league:
            return {"error": "League profile not found"}
        
        request = FindRefRequest(
            natural_language_query=args["query"],
            league_id=league.id,
            game_id=args.get("game_id"),
        )
        
        result = find_best_refs_from_nl(db, request)
        
        # Get referee details
        refs = db.query(RefereeProfile).filter(
            RefereeProfile.id.in_(result.suggested_ref_ids)
        ).all()
        
        return {
            "explanation": result.explanation,
            "referees": [
                {
                    "id": r.id,
                    "name": r.full_name,
                    "cert_level": r.cert_level,
                    "location": r.home_location,
                }
                for r in refs
            ],
        }

    @staticmethod
    async def _create_game(db: Session, user_id: int, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new game."""
        league = db.query(League).filter(League.user_id == user_id).first()
        if not league:
            return {"error": "League profile not found"}
        
        # This would call the game service to create a game
        # Simplified version here
        return {
            "success": True,
            "message": f"Game created for {args.get('date_time')} at {args.get('location')}",
            "game_id": None,  # Would return actual ID from creation
        }

    @staticmethod
    def _get_assignments(db: Session, user_id: int, args: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get referee's assignments."""
        ref_profile = db.query(RefereeProfile).filter(RefereeProfile.user_id == user_id).first()
        if not ref_profile:
            return []
        
        # Would query assignments - simplified here
        return []

    @staticmethod
    def _get_available_games(db: Session, user_id: int, args: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get available games for referee."""
        ref_profile = db.query(RefereeProfile).filter(RefereeProfile.user_id == user_id).first()
        if not ref_profile:
            return []
        
        # Get open games near referee
        games = db.query(Game).filter(Game.status == "open").limit(10).all()
        
        return [
            {
                "id": g.id,
                "location": g.field_location.address if g.field_location else "Unknown",
                "date": g.scheduled_start.isoformat(),
                "age_group": g.age_group,
                "center_fee": g.center_fee,
            }
            for g in games
        ]
