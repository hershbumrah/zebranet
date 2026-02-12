-- 0004_add_profile_image_url.sql
-- Add profile image URL to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);
