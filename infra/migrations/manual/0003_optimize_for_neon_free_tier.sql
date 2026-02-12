-- 0003_optimize_for_neon_free_tier.sql
-- Optimize database schema for Neon free tier (0.5 GB storage limit)
-- Removes audit tables, unnecessary indexes, and consolidates experience tracking

-- ============================================================================
-- DROP AUDIT TABLE (not essential for MVP)
-- ============================================================================

DROP TABLE IF EXISTS assignment_audit_log CASCADE;

-- ============================================================================
-- SIMPLIFY REFEREE EXPERIENCE TRACKING
-- ============================================================================

-- Remove detailed experience by category; store aggregate in referee_profiles instead
DROP TABLE IF EXISTS referee_experience_by_category CASCADE;

-- Add experience summary columns to referee_profiles
ALTER TABLE referee_profiles
ADD COLUMN IF NOT EXISTS experience_summary JSONB DEFAULT '{}'::jsonb;
-- Example: {"U10_games": 45, "U12_games": 32, "Adult_games": 120}

-- ============================================================================
-- SIMPLIFY GAME REQUIREMENTS (optional - keep if matching is important)
-- ============================================================================

-- If you want to keep game_ref_requirements but simplify:
-- Just keep the table as-is; it's small and useful for matching logic

-- ============================================================================
-- REMOVE REDUNDANT INDEXES (keep only critical ones)
-- ============================================================================

-- Keep only indexes that improve query performance for common operations:
-- - Finding available referees
-- - Looking up games by league/status
-- - Checking availability
-- - Message queries

DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_referee_profiles_total_games;
DROP INDEX IF EXISTS idx_league_ref_requirements_game_id;
DROP INDEX IF EXISTS idx_game_ref_requirements_game_id;

-- ============================================================================
-- OPTIMIZE FIELD LOCATIONS (consolidate duplicates)
-- ============================================================================

-- Remove duplicates: keep only one per league+name combination
DELETE FROM field_locations f1
WHERE f1.id NOT IN (
    SELECT MIN(id)
    FROM field_locations f2
    WHERE f2.league_id = f1.league_id
    AND f2.name = f1.name
    GROUP BY f2.league_id, f2.name
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE field_locations
ADD CONSTRAINT uq_field_location_per_league 
UNIQUE (league_id, name);

-- ============================================================================
-- OPTIMIZE REF_NOTES & RATINGS (archive old data if needed)
-- ============================================================================

-- Consider archiving old ratings/notes (older than 6 months)
-- For now, just add indexes for lookup

CREATE INDEX IF NOT EXISTS idx_ratings_composite ON ratings(referee_id, league_id);
CREATE INDEX IF NOT EXISTS idx_ref_notes_composite ON ref_notes(referee_id, league_id);

-- ============================================================================
-- CONSOLIDATE INDEXES ON MESSAGES
-- ============================================================================

DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_recipient_id;

-- Keep only composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread 
ON messages(recipient_id, is_read) 
WHERE is_read = FALSE;

-- ============================================================================
-- FINAL OPTIMIZATION NOTES
-- ============================================================================

-- The following remain to keep the system functional:
-- - users (2-10 MB)
-- - referee_profiles (1-5 MB)
-- - leagues (minimal)
-- - field_locations (minimal - deduplicated)
-- - games (5-20 MB depending on volume)
-- - assignments (2-10 MB)
-- - game_ref_requirements (minimal)
-- - ratings (1-5 MB)
-- - ref_notes (1-5 MB)
-- - messages (10-50 MB depending on messaging volume)
-- - availability_slots (1-5 MB)
--
-- Total expected size: 25-120 MB with moderate usage
-- Well within Neon free tier 0.5 GB limit

-- To further reduce size if needed:
-- 1. Archive old games/assignments to a separate schema
-- 2. Implement message retention policies (soft-delete after 90 days)
-- 3. Periodically vacuum and analyze tables
-- 4. Use JSONB for flexible semi-structured data instead of new tables

