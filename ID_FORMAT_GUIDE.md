# Complete ID Format Guide for RumPlay

## 📋 Current System Overview

### What Format Does the System Use?

The system is **designed to use UUID v4 format (36 characters with hyphens)**.

**Example of correct format**: `550e8400-e29b-41d4-a716-446655440000`

### Database Schema

According to `backend/schema.sql`, all ID columns are defined as:
```sql
id CHAR(36) PRIMARY KEY DEFAULT (UUID())
```

This means:
- **user_id**: CHAR(36) - UUID v4 with hyphens
- **channel_id**: CHAR(36) - UUID v4 with hyphens  
- **video_id**: CHAR(36) - UUID v4 with hyphens
- **comment_id**: CHAR(36) - UUID v4 with hyphens

## 🔍 How to Check Your Database

If you're unsure what format your database actually uses, run this SQL query:

```sql
-- Check the actual ID format in your database
SELECT 
    id as user_id,
    LENGTH(id) as id_length,
    channel_id,
    LENGTH(channel_id) as channel_id_length
FROM users 
LIMIT 1;

SELECT 
    id as video_id,
    LENGTH(id) as id_length,
    user_id,
    LENGTH(user_id) as user_id_length,
    channel_id,
    LENGTH(channel_id) as channel_id_length
FROM videos 
LIMIT 1;
```

**Expected results:**
- `id_length`: **36** (UUID with hyphens)
- `channel_id_length`: **36** (UUID with hyphens)
- `user_id_length`: **36** (UUID with hyphens)

**If you see 32 instead of 36**, your database is storing UUIDs without hyphens, which means there's a mismatch.

## 🔧 If Your Database Uses 32-Character IDs (No Hyphens)

If your database has IDs like `d4bc569e090acbbc17354bd3657adb4d` (32 chars, no hyphens), you have two options:

### Option 1: Convert Database to Use 36-Character UUIDs (Recommended)

This is the recommended approach because it matches the schema design.

**⚠️ WARNING: Backup your database before running this!**

```sql
-- Step 1: Check current format
SELECT id, LENGTH(id) as len FROM users LIMIT 5;
SELECT id, LENGTH(id) as len FROM videos LIMIT 5;
SELECT id, LENGTH(id) as len FROM channels LIMIT 5;

-- Step 2: If length is 32, convert to 36-character format
-- This adds hyphens in the correct positions

-- For users table
UPDATE users 
SET id = CONCAT(
    SUBSTRING(id, 1, 8), '-',
    SUBSTRING(id, 9, 4), '-',
    SUBSTRING(id, 13, 4), '-',
    SUBSTRING(id, 17, 4), '-',
    SUBSTRING(id, 21, 12)
)
WHERE LENGTH(id) = 32;

-- For channels table
UPDATE channels 
SET id = CONCAT(
    SUBSTRING(id, 1, 8), '-',
    SUBSTRING(id, 9, 4), '-',
    SUBSTRING(id, 13, 4), '-',
    SUBSTRING(id, 17, 4), '-',
    SUBSTRING(id, 21, 12)
)
WHERE LENGTH(id) = 32;

UPDATE channels 
SET user_id = CONCAT(
    SUBSTRING(user_id, 1, 8), '-',
    SUBSTRING(user_id, 9, 4), '-',
    SUBSTRING(user_id, 13, 4), '-',
    SUBSTRING(user_id, 17, 4), '-',
    SUBSTRING(user_id, 21, 12)
)
WHERE LENGTH(user_id) = 32;

-- For videos table
UPDATE videos 
SET id = CONCAT(
    SUBSTRING(id, 1, 8), '-',
    SUBSTRING(id, 9, 4), '-',
    SUBSTRING(id, 13, 4), '-',
    SUBSTRING(id, 17, 4), '-',
    SUBSTRING(id, 21, 12)
)
WHERE LENGTH(id) = 32;

UPDATE videos 
SET user_id = CONCAT(
    SUBSTRING(user_id, 1, 8), '-',
    SUBSTRING(user_id, 9, 4), '-',
    SUBSTRING(user_id, 13, 4), '-',
    SUBSTRING(user_id, 17, 4), '-',
    SUBSTRING(user_id, 21, 12)
)
WHERE LENGTH(user_id) = 32;

UPDATE videos 
SET channel_id = CONCAT(
    SUBSTRING(channel_id, 1, 8), '-',
    SUBSTRING(channel_id, 9, 4), '-',
    SUBSTRING(channel_id, 13, 4), '-',
    SUBSTRING(channel_id, 17, 4), '-',
    SUBSTRING(channel_id, 21, 12)
)
WHERE LENGTH(channel_id) = 32;

-- For sessions table
UPDATE sessions 
SET user_id = CONCAT(
    SUBSTRING(user_id, 1, 8), '-',
    SUBSTRING(user_id, 9, 4), '-',
    SUBSTRING(user_id, 13, 4), '-',
    SUBSTRING(user_id, 17, 4), '-',
    SUBSTRING(user_id, 21, 12)
)
WHERE LENGTH(user_id) = 32;

-- For video_likes table
UPDATE video_likes 
SET video_id = CONCAT(
    SUBSTRING(video_id, 1, 8), '-',
    SUBSTRING(video_id, 9, 4), '-',
    SUBSTRING(video_id, 13, 4), '-',
    SUBSTRING(video_id, 17, 4), '-',
    SUBSTRING(video_id, 21, 12)
)
WHERE LENGTH(video_id) = 32;

UPDATE video_likes 
SET user_id = CONCAT(
    SUBSTRING(user_id, 1, 8), '-',
    SUBSTRING(user_id, 9, 4), '-',
    SUBSTRING(user_id, 13, 4), '-',
    SUBSTRING(user_id, 17, 4), '-',
    SUBSTRING(user_id, 21, 12)
)
WHERE LENGTH(user_id) = 32;

-- For video_comments table
UPDATE video_comments 
SET video_id = CONCAT(
    SUBSTRING(video_id, 1, 8), '-',
    SUBSTRING(video_id, 9, 4), '-',
    SUBSTRING(video_id, 13, 4), '-',
    SUBSTRING(video_id, 17, 4), '-',
    SUBSTRING(video_id, 21, 12)
)
WHERE LENGTH(video_id) = 32;

UPDATE video_comments 
SET user_id = CONCAT(
    SUBSTRING(user_id, 1, 8), '-',
    SUBSTRING(user_id, 9, 4), '-',
    SUBSTRING(user_id, 13, 4), '-',
    SUBSTRING(user_id, 17, 4), '-',
    SUBSTRING(user_id, 21, 12)
)
WHERE LENGTH(user_id) = 32;

-- For subscriptions table
UPDATE subscriptions 
SET user_id = CONCAT(
    SUBSTRING(user_id, 1, 8), '-',
    SUBSTRING(user_id, 9, 4), '-',
    SUBSTRING(user_id, 13, 4), '-',
    SUBSTRING(user_id, 17, 4), '-',
    SUBSTRING(user_id, 21, 12)
)
WHERE LENGTH(user_id) = 32;

UPDATE subscriptions 
SET creator_id = CONCAT(
    SUBSTRING(creator_id, 1, 8), '-',
    SUBSTRING(creator_id, 9, 4), '-',
    SUBSTRING(creator_id, 13, 4), '-',
    SUBSTRING(creator_id, 17, 4), '-',
    SUBSTRING(creator_id, 21, 12)
)
WHERE LENGTH(creator_id) = 32;

-- Step 3: Verify the conversion
SELECT id, LENGTH(id) as len FROM users LIMIT 5;
SELECT id, LENGTH(id) as len FROM videos LIMIT 5;
SELECT id, LENGTH(id) as len FROM channels LIMIT 5;
```

### Option 2: Update Backend to Strip Hyphens (Not Recommended)

If you can't modify the database, you can modify the PHP backend to strip hyphens from IDs. However, this creates inconsistency and is not recommended.

## 📊 API Expectations

### What the Frontend Sends

The frontend (useVideoScreenData.ts) sends IDs exactly as they are stored in the database. It expects:

```typescript
// Video Details Request
GET /api/video/details.php?video_id={videoId}

// Channel Details Request  
GET /api/channel/details.php?channel_id={channelId}

// Comments Request
GET /api/video/comments.php?video_id={videoId}

// Recommended Videos Request
GET /api/video/recommended.php?video_id={videoId}
```

### What the APIs Return

**Video Details Response:**
```json
{
  "success": true,
  "video": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
    "channel_id": "f1e2d3c4-b5a6-4987-a654-321098765432",
    "title": "Video Title",
    "description": "Video description",
    "video_url": "https://...",
    "thumbnail": "https://...",
    "views": 100,
    "likes": 10,
    "dislikes": 0,
    "uploader": {
      "id": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
      "username": "user123",
      "name": "User Name",
      "profile_pic": "https://...",
      "channel_id": "f1e2d3c4-b5a6-4987-a654-321098765432"
    },
    "is_liked": false,
    "is_disliked": false,
    "is_saved": false
  },
  "comments": [...]
}
```

**Channel Details Response:**
```json
{
  "success": true,
  "channel": {
    "id": "f1e2d3c4-b5a6-4987-a654-321098765432",
    "user_id": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
    "name": "Channel Name",
    "handle": "@channelhandle",
    "avatar": "https://...",
    "banner": "https://...",
    "description": "Channel description",
    "subscriber_count": 100,
    "total_views": 1000,
    "verified": 0,
    "is_subscribed": false
  }
}
```

## 🐛 Debugging "Unauthorized" Error

The "Unauthorized" error on `/api/video/details.php` typically happens when:

1. **Invalid token is sent**: The token exists but is not in the database or is expired
2. **Token format is wrong**: Not 96 characters hex
3. **Session expired**: Token is older than 30 days

### How Authentication Works on video/details.php

This endpoint has **optional authentication**:
- **Without token**: Returns basic video info
- **With valid token**: Returns video info + `is_liked`, `is_disliked`, `is_saved` flags
- **With invalid token**: Now returns basic video info (gracefully handles auth errors)

### Debug Steps

1. **Check if video exists:**
```sql
SELECT id, title, LENGTH(id) as id_length 
FROM videos 
WHERE id = 'YOUR_VIDEO_ID';
```

2. **Check token validity:**
```sql
SELECT 
    s.token,
    s.user_id,
    s.expires_at,
    (s.expires_at > NOW()) as is_valid
FROM sessions s
WHERE s.token = 'YOUR_TOKEN_HERE';
```

3. **Check console logs:**
The updated `api/video/details.php` now logs:
- Request received with video_id
- Looking for video: {videoId}
- Video found: {title}
- Video IDs (video_id, user_id, channel_id)
- Auth user: {userId} or 'not authenticated'
- Checking like status for user: {userId}
- Is liked: yes/no

## ✅ Verification Checklist

After fixing, verify:

- [ ] Run SQL query to check ID lengths (should be 36)
- [ ] Test API with a known video ID
- [ ] Check response includes all expected fields
- [ ] Verify IDs in response are 36 characters
- [ ] Test with authentication (should include is_liked)
- [ ] Test without authentication (should work)
- [ ] Check server logs for any errors

## 📝 Summary

**The correct format is**: UUID v4 with hyphens (36 characters)

**Example**: `d4bc569e-090a-cbbc-1735-4bd3657adb4d`

**NOT**: `d4bc569e090acbbc17354bd3657adb4d` (32 characters, no hyphens)

If your database uses 32-character IDs, **convert them to 36-character format** using the SQL queries above.

The APIs are now updated with comprehensive logging to help debug any issues.
