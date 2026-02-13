"""FastAPI application entrypoint."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import routes_ai, routes_auth, routes_games, routes_leagues, routes_refs, routes_messages


def create_app() -> FastAPI:
    app = FastAPI(title="Refium API")

    uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(routes_auth.router, prefix="/auth", tags=["auth"])
    app.include_router(routes_refs.router, prefix="/refs", tags=["refs"])
    app.include_router(routes_leagues.router, prefix="/leagues", tags=["leagues"])
    app.include_router(routes_games.router, prefix="/games", tags=["games"])
    app.include_router(routes_ai.router, prefix="/ai", tags=["ai"])
    app.include_router(routes_messages.router, prefix="/messages", tags=["messages"])

    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

    return app


app = create_app()
