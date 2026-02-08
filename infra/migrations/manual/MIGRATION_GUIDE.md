# Initial Migration Guide

## What This Migration Does

The `0001_initial_schema.sql` file creates a **production-ready database schema** with:

### ✅ Authentication & User Management
- **Users table** with email/password auth, role-based access (referee, league, admin)
- Secure password hashing (handled by FastAPI/bcrypt)
- Email uniqueness enforcement

### ✅ Referee Profiles & Metrics
- **Referee experience tracking**: years reffing, certifications, position specializations
- **Experience by category table**: tracks how many games they've reffed at each age group/gender level (U10 girls, U19 boys, etc.)
- **Location & travel**: home location, coordinates, willingness to travel radius
- **Total games counter**: auto-updated by your app logic
- Competency levels per category (beginner → intermediate → expert)

### ✅ Availability System
- **Availability slots table**: referees mark when they're free to referee
- Recurring availability support (weekly, biweekly patterns)
- Time-range queries optimized with indexes

### ✅ League & Game Management
- **League profiles**: name, region, level (recreational/competitive/elite)
- **Field locations table**: leagues define and manage field locations (not HQ, but actual game fields)
- **Games table**: references field locations, tracks age group, gender focus, competition level, fees
- **Game requirements**: leagues define minimum experience/certification needed per role

### ✅ Assignment & Matching
- **Assignments table**: tracks which referee is assigned to which game role
- Status lifecycle: requested → accepted/rejected → confirmed → completed/no_show
- Role support: center ref, AR1, AR2, etc.
- Audit trail with timestamps

### ✅ Performance & Feedback
- **Ratings table**: leagues rate referees (1-5 scale) after each game, with comments
- **Notes table**: private feedback from leagues about refs, with visibility control
  - `private_to_league`: only that league sees it
  - `visible_to_ref`: the referee can see it
  - `visible_to_all_leagues`: shared across leagues (use cautiously)
- Tracks games, so rating history is permanent

### ✅ Audit Logging
- **Assignment audit log**: tracks status changes on assignments (e.g., who requested, when rejected, why)
- Useful for debugging and compliance

---

## Senior Architect Enhancements

Beyond your requirements, I added:

1. **Indexes on all foreign keys & common queries** → faster lookups by email, role, referee location, game status, etc.
2. **CHECK constraints** → enforce data consistency (e.g., roles must be valid, scores 1–5, end_time > start_time)
3. **Timestamps everywhere** → `created_at` & `updated_at` for audit trails
4. **Status enums** → predefined values prevent typos (open/pending/assigned/completed/cancelled)
5. **Logical cascades** → deleting a user also deletes their referee profile, games, assignments, etc.
6. **Uniqueness constraints** → a referee can't be assigned to the same game in the same role twice
7. **Audit table for assignments** → track who changed assignments and why (compliance-ready)

---

## How to Apply This Migration

### Local Development

1. **Start the database**:
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **Verify it's running**:
   ```bash
   docker-compose ps
   ```
   You should see a healthy PostgreSQL container.

3. **Apply the migration**:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL='postgresql+psycopg2://postgres:postgres@localhost:5432/refnexus'
   psql "$env:DATABASE_URL" -f infra/migrations/manual/0001_initial_schema.sql
   ```

4. **Verify tables exist**:
   ```bash
   psql "$env:DATABASE_URL" -c "\dt"
   ```
   You should see 11 tables listed.

### Staging / Production

1. **Backup first** (if data exists):
   ```bash
   pg_dump "$DATABASE_URL" > backup_before_migration.sql
   ```

2. **Apply the migration**:
   ```bash
   psql "$DATABASE_URL" -f infra/migrations/manual/0001_initial_schema.sql
   ```

3. **Run tests** to confirm app can read/write data.

---

## Next Steps After This Migration

1. **Test with the app**:
   - Run the backend (`uvicorn app.main:app --reload`)
   - Try creating a user via the /register endpoint
   - Confirm the user is created in the database

2. **Populate initial data** (optional):
   - Create seed data for testing (demo leagues, refs, games)
   - See `0002_seed_data.sql` (to be created)

3. **Add additional migrations** for future schema changes:
   - Example: `0002_add_referee_certifications_table.sql`
   - Example: `0003_add_payment_tracking.sql`

---

## Rollback (if needed)

If you need to revert this migration (⚠️ deletes all data):

```bash
psql "$DATABASE_URL" -c "
DROP TABLE IF EXISTS assignment_audit_log CASCADE;
DROP TABLE IF EXISTS ref_notes CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS game_ref_requirements CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS field_locations CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS referee_experience_by_category CASCADE;
DROP TABLE IF EXISTS referee_profiles CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
"
```

⚠️ This is destructive. Only use in development or if you have backups.

---

## Questions?

- Check [infra/DEPLOYMENT_PLAN.md](../DEPLOYMENT_PLAN.md) for deployment strategy
- Review [src/backend/src/app/models](../../src/backend/src/app/models) to understand the Python-side schema definitions
