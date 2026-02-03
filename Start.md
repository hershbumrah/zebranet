# Start RefNexus

This guide shows how to run the backend and frontend locally.

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

## Backend (FastAPI)
1. Copy the example environment file and set values:
   - Copy backend/.env.example to backend/.env
   - Update DATABASE_URL, JWT_SECRET_KEY, and OPENAI_API_KEY
2. Install dependencies (from backend/):
   - uv sync
3. Initialize the database (from backend/):
   - uv run python -m app.db.init_db
4. Start the API server (from backend/):
   - uv run uvicorn app.main:app --reload

API will be available at http://localhost:8000

## Frontend (Vite)
1. Install dependencies (from frontend/):
   - npm i
2. Start the dev server (from frontend/):
   - npm run dev

Frontend will be available at http://localhost:5173

## Notes
- If you change database settings, re-run the init step.
- For production, set CORS origins in backend/src/app/main.py.
