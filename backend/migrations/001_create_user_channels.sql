-- ============================================
-- Migration Script: Create Channels for Existing Users
-- Purpose: Add channels for users who don't have one
-- Run this on your production database
-- ============================================

-- Step 1: Check how many users need channels
SELECT COUNT(*) as users_without_channels 
FROM users 
WHERE channel_id IS NULL;

-- Step 2: Create channels for all users without one
-- This uses a safe INSERT that won't fail if channel exists
INSERT INTO channels (id, user_id, name, handle, description, monetization, created_at)
SELECT 
    UUID() as id,
    u.id as user_id,
    CONCAT(u.username, "'s Channel") as name,
    CONCAT(
        '@', 
        LOWER(REGEXP_REPLACE(u.username, '[^a-zA-Z0-9]', '')),
        '_',
        SUBSTRING(UUID(), 1, 6)
    ) as handle,
    'Welcome to my channel!' as description,
    JSON_ARRAY() as monetization,
    NOW() as created_at
FROM users u
WHERE u.channel_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM channels c WHERE c.user_id = u.id
);

-- Step 3: Update users table to link to their channels
UPDATE users u
INNER JOIN channels c ON c.user_id = u.id
SET u.channel_id = c.id
WHERE u.channel_id IS NULL;

-- Step 4: Verify all users now have channels
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN channel_id IS NOT NULL THEN 1 ELSE 0 END) as users_with_channels,
    SUM(CASE WHEN channel_id IS NULL THEN 1 ELSE 0 END) as users_without_channels
FROM users;

-- Step 5: Check sample of created channels
SELECT 
    u.username,
    u.email,
    c.id as channel_id,
    c.name as channel_name,
    c.handle as channel_handle
FROM users u
INNER JOIN channels c ON c.id = u.channel_id
LIMIT 10;
