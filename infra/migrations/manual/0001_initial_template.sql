-- 0001_initial_schema.sql
-- Production-ready initial database schema for RefNexus
-- Supports multi-user roles (referees & league managers), availability tracking, game assignments, and performance metrics

-- ============================================================================
-- AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('referee', 'league', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- REFEREE PROFILES & EXPERIENCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referee_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    
    -- Experience & Credentials
    cert_level VARCHAR(100),  -- e.g., 'U8', 'U12', 'Adult', 'Advanced'
    years_experience INTEGER,  -- Total years reffing
    
    -- Position specialization
    primary_positions VARCHAR(255),  -- e.g., 'Center, AR (Assistant Ref)'
    
    -- Location & Travel
    home_location VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    travel_radius_km FLOAT,
    
    -- Career history
    total_games_reffed INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referee_profiles_user_id ON referee_profiles(user_id);
CREATE INDEX idx_referee_profiles_location ON referee_profiles(home_location);
CREATE INDEX idx_referee_profiles_total_games ON referee_profiles(total_games_reffed);

-- Track referee experience by age group & competition level
CREATE TABLE IF NOT EXISTS referee_experience_by_category (
    id SERIAL PRIMARY KEY,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    age_group VARCHAR(100) NOT NULL,  -- e.g., 'U10', 'U19', 'Adult'
    gender_focus VARCHAR(50),  -- e.g., 'Boys', 'Girls', 'Mixed'
    games_reffed INTEGER NOT NULL DEFAULT 0,
    last_game_date TIMESTAMP WITH TIME ZONE,
    competency_level VARCHAR(50) DEFAULT 'beginner' CHECK (competency_level IN ('beginner', 'intermediate', 'expert')),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referee_id, age_group, gender_focus)
);

CREATE INDEX idx_referee_experience_category ON referee_experience_by_category(referee_id, age_group);

-- ============================================================================
-- AVAILABILITY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS availability_slots (
    id SERIAL PRIMARY KEY,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),  -- e.g., 'weekly', 'biweekly'
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_referee_id ON availability_slots(referee_id);
CREATE INDEX idx_availability_start_time ON availability_slots(start_time);
CREATE INDEX idx_availability_end_time ON availability_slots(end_time);

-- ============================================================================
-- LEAGUE PROFILES & GAME MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS leagues (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    primary_region VARCHAR(255),
    
    -- League level / tier
    level VARCHAR(100),  -- e.g., 'recreational', 'competitive', 'elite'
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leagues_user_id ON leagues(user_id);
CREATE INDEX idx_leagues_primary_region ON leagues(primary_region);
CREATE INDEX idx_leagues_level ON leagues(level);

-- ============================================================================
-- FIELD LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS field_locations (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,  -- e.g., 'Central Park Field A', 'Downtown Complex'
    address VARCHAR(500),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_field_locations_league_id ON field_locations(league_id);
CREATE INDEX idx_field_locations_coords ON field_locations(latitude, longitude);

-- ============================================================================
-- GAMES & ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    field_location_id INTEGER NOT NULL REFERENCES field_locations(id) ON DELETE RESTRICT,
    
    -- Game scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Game details
    age_group VARCHAR(100),  -- e.g., 'U10', 'U19'
    gender_focus VARCHAR(50),  -- e.g., 'Boys', 'Girls', 'Mixed'
    competition_level VARCHAR(100),  -- e.g., 'group stage', 'finals'
    
    -- Game status
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'assigned', 'completed', 'cancelled')),
    
    -- Fee structure
    center_fee FLOAT,
    ar_fee FLOAT,
    
    -- Internal tracking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_league_id ON games(league_id);
CREATE INDEX idx_games_field_location_id ON games(field_location_id);
CREATE INDEX idx_games_scheduled_start ON games(scheduled_start);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_age_group ON games(age_group);

-- Track referee assignments to games
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    
    -- Role in the game
    role VARCHAR(50) NOT NULL,  -- e.g., 'center', 'ar1', 'ar2'
    
    -- Assignment lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'rejected', 'confirmed', 'completed', 'no_show')),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_id, referee_id, role)
);

CREATE INDEX idx_assignments_game_id ON assignments(game_id);
CREATE INDEX idx_assignments_referee_id ON assignments(referee_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_assigned_at ON assignments(assigned_at);

-- ============================================================================
-- LEAGUE REQUIREMENTS & REF MATCHING CRITERIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_ref_requirements (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- e.g., 'center', 'ar1', 'ar2'
    
    -- Minimum experience required
    min_years_experience INTEGER,
    min_cert_level VARCHAR(100),
    
    -- Preferred specializations
    required_age_group_experience VARCHAR(100),  -- e.g., 'must have U10 experience'
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_id, role)
);

CREATE INDEX idx_game_ref_requirements_game_id ON game_ref_requirements(game_id);

-- ============================================================================
-- PERFORMANCE & FEEDBACK
-- ============================================================================

-- League ratings of referees
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    
    -- Rating details
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment VARCHAR(1000),
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_referee_id ON ratings(referee_id);
CREATE INDEX idx_ratings_league_id ON ratings(league_id);
CREATE INDEX idx_ratings_game_id ON ratings(game_id);
CREATE INDEX idx_ratings_score ON ratings(score);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);

-- Notes/feedback about referees from leagues (can be private)
CREATE TABLE IF NOT EXISTS ref_notes (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    
    -- Note content & privacy
    note_text VARCHAR(2000) NOT NULL,
    visibility VARCHAR(50) NOT NULL DEFAULT 'private_to_league' CHECK (visibility IN ('private_to_league', 'visible_to_ref', 'visible_to_all_leagues')),
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ref_notes_referee_id ON ref_notes(referee_id);
CREATE INDEX idx_ref_notes_league_id ON ref_notes(league_id);
CREATE INDEX idx_ref_notes_visibility ON ref_notes(visibility);

-- ============================================================================
-- AUDIT & SYSTEM LOGGING
-- ============================================================================

-- Optional: Track assignment history for audit purposes
CREATE TABLE IF NOT EXISTS assignment_audit_log (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(500)
);

CREATE INDEX idx_assignment_audit_log_assignment_id ON assignment_audit_log(assignment_id);
CREATE INDEX idx_assignment_audit_log_changed_at ON assignment_audit_log(changed_at);

-- ============================================================================
-- SYSTEM INTEGRITY CHECKS
-- ============================================================================

-- Verify that all referee_profiles are linked to 'referee' role users
ALTER TABLE referee_profiles
ADD CONSTRAINT check_referee_role
CHECK (user_id IN (SELECT id FROM users WHERE role = 'referee'));

-- Verify that all leagues are linked to 'league' role users
ALTER TABLE leagues
ADD CONSTRAINT check_league_role
CHECK (user_id IN (SELECT id FROM users WHERE role = 'league'));

-- ============================================================================
-- GRANT permissions (adjust user as needed for your environment)
-- ============================================================================

-- Uncomment if running in managed environment with specific DB user:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
