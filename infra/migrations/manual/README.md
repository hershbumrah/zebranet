Manual migrations directory

- Place SQL files here in sequential numeric order: `0001_init.sql`, `0002_add_column_xyz.sql`, etc.
- Each file should be idempotent or guarded so re-running won't break.
- Apply scripts in order against the target database (staging, then production).

Example apply command (from repo root):

psql "$DATABASE_URL" -f infra/migrations/manual/0001_init.sql

Notes:
- For schema changes that are disruptive, run in multiple steps: create nullable column, deploy code, backfill, then make non-null.
- Keep a rollback (reverse) script alongside each migration if possible.
