-- Video Screen API - Complete SQL Schema
-- This schema includes all tables required for the video_screen.php API
-- All IDs use CHAR(32) format for consistency with your existing database

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(32) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL DEFAULT 'user',
  profile_pic VARCHAR(512) NULL,
  bio TEXT NULL,
  phone VARCHAR(32) NULL,
  channel_id CHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHANNELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS channels (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(100) NOT NULL UNIQUE,
  avatar VARCHAR(512) NULL,
  banner VARCHAR(512) NULL,
  description TEXT NOT NULL,
  subscriber_count INT NOT NULL DEFAULT 0,
  total_views BIGINT NOT NULL DEFAULT 0,
  total_watch_hours BIGINT NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_channels_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_handle (handle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIDEOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  channel_id CHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  video_url VARCHAR(1024) NOT NULL,
  thumbnail VARCHAR(1024) NOT NULL,
  privacy ENUM('public','private','unlisted','scheduled') NOT NULL DEFAULT 'public',
  views BIGINT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  dislikes INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 0,
  category VARCHAR(128) NOT NULL,
  tags JSON NOT NULL,
  is_short TINYINT(1) NOT NULL DEFAULT 0,
  is_live TINYINT(1) NOT NULL DEFAULT 0,
  scheduled_date DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_videos_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_videos_channel FOREIGN KEY (channel_id) 
    REFERENCES channels(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_channel_id (channel_id),
  INDEX idx_privacy (privacy),
  INDEX idx_category (category),
  INDEX idx_is_short (is_short),
  INDEX idx_views (views),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIDEO LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_likes (
  id CHAR(32) PRIMARY KEY,
  video_id CHAR(32) NOT NULL,
  user_id CHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_video_likes_video FOREIGN KEY (video_id) 
    REFERENCES videos(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_likes_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_video_likes UNIQUE (video_id, user_id),
  INDEX idx_video_id (video_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIDEO COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_comments (
  id CHAR(32) PRIMARY KEY,
  video_id CHAR(32) NOT NULL,
  user_id CHAR(32) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_video_comments_video FOREIGN KEY (video_id) 
    REFERENCES videos(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_comments_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_video_id (video_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  creator_id CHAR(32) NOT NULL COMMENT 'Channel ID',
  notifications TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_creator FOREIGN KEY (creator_id) 
    REFERENCES channels(id) ON DELETE CASCADE,
  CONSTRAINT uq_subscriptions UNIQUE (user_id, creator_id),
  INDEX idx_user_id (user_id),
  INDEX idx_creator_id (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SESSIONS TABLE (for authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(96) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HELPER FUNCTION: Generate UUID (32 characters without hyphens)
-- ============================================================================
-- Note: Your generateUUID() PHP function should produce 32-character IDs
-- Example: d4bc569e090acbbc17354bd3657adb4d

-- ============================================================================
-- SAMPLE DATA QUERIES (Optional - for testing)
-- ============================================================================

-- Insert a test user
-- INSERT INTO users (id, username, name, email, password_hash, password_salt) 
-- VALUES ('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'testuser', 'Test User', 'test@example.com', 'hash', 'salt');

-- Insert a test channel
-- INSERT INTO channels (id, user_id, name, handle, description, subscriber_count) 
-- VALUES ('c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'Test Channel', '@testchannel', 'Test channel description', 0);

-- Insert a test video
-- INSERT INTO videos (id, user_id, channel_id, title, description, video_url, thumbnail, category, tags, duration, views, likes) 
-- VALUES ('d4bc569e090acbbc17354bd3657adb4d', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6', 
--         'Test Video', 'Test video description', 'https://example.com/video.mp4', 'https://example.com/thumb.jpg', 
--         'Technology', '["tech","tutorial"]', 300, 0, 0);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if all tables exist
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('users', 'channels', 'videos', 'video_likes', 'video_comments', 'subscriptions', 'sessions');

-- Check indexes on videos table
SHOW INDEX FROM videos;

-- Check foreign key constraints
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN ('videos', 'video_likes', 'video_comments', 'subscriptions', 'channels');

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Clean up old sessions (run periodically)
-- DELETE FROM sessions WHERE expires_at < NOW();

-- Rebuild subscriber counts (if they get out of sync)
-- UPDATE channels c
-- SET subscriber_count = (
--   SELECT COUNT(*) 
--   FROM subscriptions s 
--   WHERE s.creator_id = c.id
-- );

-- Rebuild video like counts (if they get out of sync)
-- UPDATE videos v
-- SET likes = (
--   SELECT COUNT(*) 
--   FROM video_likes vl 
--   WHERE vl.video_id = v.id
-- );

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Analyze tables for query optimization
-- ANALYZE TABLE users, channels, videos, video_likes, video_comments, subscriptions;

-- Optimize tables
-- OPTIMIZE TABLE users, channels, videos, video_likes, video_comments, subscriptions;
