"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_ai, routes_auth, routes_games, routes_leagues, routes_refs


def create_app() -> FastAPI:
    app = FastAPI(title="RefNexus API")

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

    return app


app = create_app()
