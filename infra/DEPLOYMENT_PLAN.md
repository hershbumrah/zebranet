# Current Deployment Plan

## Overview
This repository currently documents local development workflows only. There is no infrastructure-as-code, CI/CD pipeline, or cloud hosting configuration committed yet.

## Services
- **Backend**: FastAPI application located in `src/backend`.
- **Frontend**: Vite/React application located in `src/frontend`.
- **Database**: PostgreSQL (external/local), configured via `DATABASE_URL`.

## Environments
- **Local development** is the only defined environment at this time.
- **Staging/Production** are not defined in code or documentation yet.

## Current Deployment Flow (Local Only)
### Backend
1. Create and activate a Python virtual environment in `src/backend`.
2. Install dependencies with `uv sync`.
3. Initialize the database with `uv run python -m app.db.init_db`.
4. Run the API server with `uv run uvicorn app.main:app --reload`.

### Frontend
1. Install dependencies with `npm i` in `src/frontend`.
2. Run the dev server with `npm run dev`.

## Configuration
- Backend environment variables are stored in `src/backend/.env` (copy from `.env.example`).
- Required values include `DATABASE_URL`, `JWT_SECRET_KEY`, and `OPENAI_API_KEY`.

## CI/CD
- No build or deployment pipelines are currently defined in this repository.
- No container images, Dockerfiles, or IaC templates exist yet.

## Known Gaps / Next Steps
- Decide hosting targets (e.g., Azure App Service, Render, Fly.io, etc.).
- Add Infrastructure as Code (e.g., Terraform/Bicep) under `infra/`.
- Define build and deploy pipelines in GitHub Actions.
- Add production configuration for CORS, secrets, and database migrations.

---
**Status:** Documented based on current repository contents (local-only flow).
