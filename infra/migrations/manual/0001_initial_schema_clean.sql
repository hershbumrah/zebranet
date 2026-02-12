-- 0001_initial_schema_clean.sql
-- Production-ready initial database schema for RefNexus
-- Idempotent version: uses IF NOT EXISTS on all creates

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- REFEREE PROFILES & EXPERIENCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referee_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    
    -- Experience & Credentials
    cert_level VARCHAR(100),
    years_experience INTEGER,
    
    -- Position specialization
    primary_positions VARCHAR(255),
    
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

CREATE INDEX IF NOT EXISTS idx_referee_profiles_user_id ON referee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_referee_profiles_location ON referee_profiles(home_location);

-- ============================================================================
-- AVAILABILITY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS availability_slots (
    id SERIAL PRIMARY KEY,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_referee_id ON availability_slots(referee_id);
CREATE INDEX IF NOT EXISTS idx_availability_start_time ON availability_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_availability_end_time ON availability_slots(end_time);

-- ============================================================================
-- LEAGUE PROFILES & GAME MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS leagues (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    primary_region VARCHAR(255),
    level VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leagues_user_id ON leagues(user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_primary_region ON leagues(primary_region);
CREATE INDEX IF NOT EXISTS idx_leagues_level ON leagues(level);

-- ============================================================================
-- FIELD LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS field_locations (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_field_locations_league_id ON field_locations(league_id);
CREATE INDEX IF NOT EXISTS idx_field_locations_coords ON field_locations(latitude, longitude);

-- ============================================================================
-- GAMES & ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    field_location_id INTEGER NOT NULL REFERENCES field_locations(id) ON DELETE RESTRICT,
    
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    
    age_group VARCHAR(100),
    gender_focus VARCHAR(50),
    competition_level VARCHAR(100),
    
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'assigned', 'completed', 'cancelled')),
    
    center_fee FLOAT,
    ar_fee FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_league_id ON games(league_id);
CREATE INDEX IF NOT EXISTS idx_games_field_location_id ON games(field_location_id);
CREATE INDEX IF NOT EXISTS idx_games_scheduled_start ON games(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_age_group ON games(age_group);

-- Track referee assignments to games
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'rejected', 'confirmed', 'completed', 'no_show')),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_id, referee_id, role)
);

CREATE INDEX IF NOT EXISTS idx_assignments_game_id ON assignments(game_id);
CREATE INDEX IF NOT EXISTS idx_assignments_referee_id ON assignments(referee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at ON assignments(assigned_at);

-- ============================================================================
-- LEAGUE REQUIREMENTS & REF MATCHING CRITERIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_ref_requirements (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    
    min_years_experience INTEGER,
    min_cert_level VARCHAR(100),
    required_age_group_experience VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_id, role)
);

CREATE INDEX IF NOT EXISTS idx_game_ref_requirements_game_id ON game_ref_requirements(game_id);

-- ============================================================================
-- PERFORMANCE & FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment VARCHAR(1000),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ratings_referee_id ON ratings(referee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_league_id ON ratings(league_id);
CREATE INDEX IF NOT EXISTS idx_ratings_game_id ON ratings(game_id);
CREATE INDEX IF NOT EXISTS idx_ratings_score ON ratings(score);

-- Notes/feedback about referees from leagues
CREATE TABLE IF NOT EXISTS ref_notes (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    referee_id INTEGER NOT NULL REFERENCES referee_profiles(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    
    note_text VARCHAR(2000) NOT NULL,
    visibility VARCHAR(50) NOT NULL DEFAULT 'private_to_league' CHECK (visibility IN ('private_to_league', 'visible_to_ref', 'visible_to_all_leagues')),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ref_notes_referee_id ON ref_notes(referee_id);
CREATE INDEX IF NOT EXISTS idx_ref_notes_league_id ON ref_notes(league_id);
CREATE INDEX IF NOT EXISTS idx_ref_notes_visibility ON ref_notes(visibility);
