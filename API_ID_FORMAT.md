# API ID Format & Authentication Guide

## Overview
This document clarifies the ID formats and authentication requirements for all APIs in the application.

## ID Formats

All IDs in the system use **UUID v4 format** (36 characters including hyphens).

### Format Specification
- **Length**: 36 characters
- **Pattern**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- **Example**: `550e8400-e29b-41d4-a716-446655440000`
- **Regex**: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

### ID Types

#### 1. User ID
- **Format**: UUID v4 (36 chars)
- **Database Column**: `users.id`
- **Example**: `a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789`
- **Usage**: Identifying users across the system

#### 2. Channel ID  
- **Format**: UUID v4 (36 chars)
- **Database Column**: `channels.id`
- **Example**: `f1e2d3c4-b5a6-4987-a654-321098765432`
- **Usage**: Identifying channels (auto-created when user becomes creator)

#### 3. Video ID
- **Format**: UUID v4 (36 chars)
- **Database Column**: `videos.id`
- **Example**: `9a8b7c6d-5e4f-4321-a098-b7c6d5e4f321`
- **Usage**: Identifying videos and shorts

#### 4. Comment ID
- **Format**: UUID v4 (36 chars)
- **Database Column**: `video_comments.id`
- **Example**: `1a2b3c4d-5e6f-4789-a012-b3c4d5e6f789`
- **Usage**: Identifying comments

#### 5. Session Token
- **Format**: 96 character hexadecimal string
- **Database Column**: `sessions.token`
- **Example**: `a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890`
- **Usage**: Bearer token for authentication

## Authentication

### Authentication Header Format
```
Authorization: Bearer {token}
```

### Example
```
Authorization: Bearer a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890
```

### Authentication Types

#### 1. Optional Authentication
These endpoints work without authentication but provide personalized data when authenticated:

- `GET /api/video/details.php?video_id={videoId}`
  - Without auth: Basic video info (no `is_liked`, `is_saved` flags)
  - With auth: Includes user-specific flags (`is_liked`, `is_disliked`, `is_saved`)

- `GET /api/video/list.php`
  - Without auth: Public videos only
  - With auth: Personalized recommendations

- `GET /api/channel/details.php?channel_id={channelId}`
  - Without auth: Basic channel info
  - With auth: Includes `is_subscribed` flag

#### 2. Required Authentication
These endpoints require a valid Bearer token:

- `POST /api/video/like.php`
- `POST /api/video/comment.php`
- `POST /api/video/upload.php`
- `POST /api/subscription/subscribe.php`
- `POST /api/subscription/unsubscribe.php`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- All `/api/admin/*` endpoints
- All `/api/user/edit*` endpoints

#### 3. No Authentication Required
These endpoints are completely public:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/health.php`

## API Responses

### Video Details Response
```typescript
{
  success: boolean;
  video?: {
    id: string;                    // UUID v4 (36 chars)
    user_id: string;               // UUID v4 (36 chars)
    channel_id: string;            // UUID v4 (36 chars)
    title: string;
    description: string;
    video_url: string;
    thumbnail: string;
    views: number;
    likes: number;
    dislikes: number;
    privacy?: string;
    category?: string;
    tags?: string[];
    duration?: number;
    is_short?: number;
    created_at: string;
    updated_at?: string;
    uploader: {
      id: string;                  // UUID v4 (36 chars)
      username: string;
      name?: string;
      profile_pic?: string;
      channel_id: string;          // UUID v4 (36 chars)
    };
    comments_count?: number;
    is_liked?: boolean;            // Only present if authenticated
    is_saved?: boolean;            // Only present if authenticated
    is_disliked?: boolean;         // Only present if authenticated
  };
  comments?: Array<{
    id: string;                    // UUID v4 (36 chars)
    video_id: string;              // UUID v4 (36 chars)
    user_id: string;               // UUID v4 (36 chars)
    comment: string;
    created_at: string;
    user: {
      username: string;
      name?: string;
      profile_pic?: string;
    };
  }>;
  error?: string;
  message?: string;
}
```

### Channel Details Response
```typescript
{
  success: boolean;
  channel?: {
    id: string;                    // UUID v4 (36 chars)
    user_id: string;               // UUID v4 (36 chars)
    name: string;
    handle?: string;
    avatar?: string;
    banner?: string;
    description?: string;
    subscriber_count: number;
    total_views?: number;
    verified?: number | boolean;
    created_at?: string;
    video_count?: number;
    is_subscribed?: boolean;       // Only present if authenticated
  };
  error?: string;
  message?: string;
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Video ID required"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
**Causes**:
- Missing Authorization header
- Invalid or expired token
- Token not found in database

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden"
}
```
**Causes**:
- User doesn't have required role
- Insufficient permissions

#### 404 Not Found
```json
{
  "success": false,
  "error": "Video not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

## Frontend Integration

### Using the API from React Native

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { getEnvApiRootUrl } from '@/utils/env';

const { authToken } = useAuth();
const apiRoot = getEnvApiRootUrl();

// Example: Fetch video details
const response = await fetch(
  `${apiRoot}/video/details.php?video_id=${videoId}`,
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      // Include token if available (optional for this endpoint)
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  }
);

const data = await response.json();

if (!response.ok || !data.success) {
  const error = data.error ?? data.message ?? 'Request failed';
  throw new Error(error);
}

// Use data.video
```

### Using the Hook

The app provides a custom hook that handles all the complexity:

```typescript
import { useVideoScreenData } from '@/hooks/useVideoScreenData';

const { data, videoQuery } = useVideoScreenData(videoId);

// data.video: Contains normalized video details
// data.channel: Contains normalized channel details
// data.comments: Contains normalized comments array
// data.related: Contains normalized related videos array

// Query states
// videoQuery.isLoading, videoQuery.error, videoQuery.refetch()
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,       -- UUID v4
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  profile_pic VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  channel_id VARCHAR(36),            -- UUID v4 (FK to channels.id)
  role ENUM('user', 'creator', 'admin', 'superadmin'),
  password_hash VARCHAR(64) NOT NULL,
  password_salt VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Videos Table
```sql
CREATE TABLE videos (
  id VARCHAR(36) PRIMARY KEY,       -- UUID v4
  user_id VARCHAR(36) NOT NULL,     -- UUID v4 (FK to users.id)
  channel_id VARCHAR(36) NOT NULL,  -- UUID v4 (FK to channels.id)
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail VARCHAR(500),
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  privacy ENUM('public', 'unlisted', 'private') DEFAULT 'public',
  category VARCHAR(100),
  tags JSON,
  duration INT,
  is_short TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  token VARCHAR(96) PRIMARY KEY,     -- 96 char hex string
  user_id VARCHAR(36) NOT NULL,      -- UUID v4 (FK to users.id)
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### "Unauthorized" Error on Public Endpoints

**Problem**: Getting 401 Unauthorized on endpoints that should work without auth (like `/video/details.php`)

**Possible Causes**:
1. Token is being sent but is invalid/expired
2. Database connection issue
3. Sessions table query failing

**Solutions**:
1. Check if token exists and is valid in the database
2. Clear expired sessions from database
3. Try request without Authorization header
4. Check server error logs for detailed error messages

### Invalid ID Format

**Problem**: Getting "Video not found" or similar errors

**Solution**: Ensure IDs are in UUID v4 format (36 characters with hyphens)

**Correct**: `550e8400-e29b-41d4-a716-446655440000`  
**Wrong**: `550e8400e29b41d4a716446655440000` (missing hyphens)  
**Wrong**: `550e8400-e29b-41d4-a716` (too short)

## Summary

- **All IDs**: UUID v4 format (36 characters)
- **Tokens**: 96 character hex strings
- **Authentication**: Use `Authorization: Bearer {token}` header
- **Optional Auth Endpoints**: Work without auth but provide more data when authenticated
- **Required Auth Endpoints**: Must include valid token
- **Error Messages**: Always check `success` field and `error`/`message` for details
