# RefNexus

RefNexus is a referee scheduling and league management platform. It helps leagues create games, find qualified referees, and coordinate assignments, while allowing referees to manage availability and respond to requests. It also includes an AI assistant and a direct messaging inbox between leagues and referees.

## Intent

- Centralize game scheduling and referee assignment
- Provide fast referee discovery and communication
- Reduce back-and-forth via AI-assisted workflows
- Improve operational visibility for leagues and refs

## Core Features

- League and referee dashboards
- Game creation and management
- Referee search and AI matching
- Direct messaging inbox (league ↔ referee)
- AI assistant (RefNexus Agent) for scheduling and support
- Role-based authentication and permissions

## Tech Stack

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend

- FastAPI (Python)
- SQLAlchemy
- PostgreSQL
- JWT authentication

## Project Structure

- [src/frontend](src/frontend) — React application
- [src/backend](src/backend) — FastAPI application
- [infra](infra) — infra and migrations

## Local Development

### Backend

```bash
cd src/backend
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

## Environment Variables

Backend uses the following in [src/backend/.env](src/backend/.env):

```
DATABASE_URL=postgresql+psycopg2://<user>@localhost:5432/refnexus
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=
```

Frontend uses `VITE_API_URL` (optional) to point to the backend.

## Database

Manual migrations are stored in [infra/migrations/manual](infra/migrations/manual). Apply them with `psql` against your local database.

## Notes

- The inbox supports direct messaging and referee lookup by name/email.
- The AI assistant is integrated for league/referee workflows.
