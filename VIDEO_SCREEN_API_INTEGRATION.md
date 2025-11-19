# Video Screen API Integration Documentation

## Overview
This document provides complete details about the consolidated Video Screen API (`video_screen.php`) that handles all video player screen functionality in a single endpoint.

## API Endpoint
```
POST/GET https://your-domain.com/api/video/video_screen.php
```

## ID Format
All IDs in this system use **32-character format** (CHAR(32) in MySQL):
- `user_id`: 32 characters (e.g., `d4bc569e090acbbc17354bd3657adb4d`)
- `channel_id`: 32 characters
- `video_id`: 32 characters

The IDs are stored in the database without hyphens and are validated by the API.

---

## Actions

### 1. Fetch All Video Screen Data
**Purpose**: Get complete video information including video details, channel info, comments, and recommended videos in a single request.

#### Request
```http
GET /api/video/video_screen.php?action=fetch&video_id={VIDEO_ID}
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | Must be `"fetch"` |
| video_id | string | Yes | 32-character video ID |

#### Headers
```http
Accept: application/json
Authorization: Bearer {token}  # Optional - required for is_liked, is_subscribed
```

#### Response Format
```json
{
  "success": true,
  "video": {
    "id": "d4bc569e090acbbc17354bd3657adb4d",
    "user_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "channel_id": "c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6",
    "title": "Amazing Video Title",
    "description": "Video description here",
    "video_url": "https://example.com/videos/video.mp4",
    "thumbnail": "https://example.com/thumbnails/thumb.jpg",
    "views": 10523,
    "likes": 450,
    "dislikes": 12,
    "duration": 320,
    "category": "Technology",
    "tags": ["tech", "tutorial", "coding"],
    "privacy": "public",
    "is_short": 0,
    "created_at": "2025-01-15 10:30:00",
    "updated_at": "2025-01-15 10:30:00",
    "is_liked": true,
    "is_disliked": false,
    "is_saved": false,
    "uploader": {
      "id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      "username": "johndoe",
      "name": "John Doe",
      "profile_pic": "https://example.com/avatars/john.jpg",
      "channel_id": "c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6"
    }
  },
  "channel": {
    "id": "c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6",
    "user_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "name": "John's Tech Channel",
    "handle": "@johntech",
    "avatar": "https://example.com/avatars/channel.jpg",
    "banner": "https://example.com/banners/channel.jpg",
    "description": "Welcome to my tech channel!",
    "subscriber_count": 15420,
    "total_views": 1253000,
    "verified": 1,
    "is_subscribed": true,
    "created_at": "2024-01-01 00:00:00"
  },
  "comments": [
    {
      "id": "comment123id",
      "video_id": "d4bc569e090acbbc17354bd3657adb4d",
      "user_id": "user456id",
      "comment": "Great video!",
      "created_at": "2025-01-15 11:00:00",
      "user": {
        "username": "viewer1",
        "name": "Viewer One",
        "profile_pic": "https://example.com/avatars/viewer.jpg"
      }
    }
  ],
  "recommended": [
    {
      "id": "video789id",
      "title": "Related Video Title",
      "video_url": "https://example.com/videos/related.mp4",
      "thumbnail": "https://example.com/thumbnails/related.jpg",
      "views": 5230,
      "likes": 145,
      "duration": 240,
      "category": "Technology",
      "created_at": "2025-01-14 15:00:00",
      "uploader": {
        "id": "uploader123",
        "username": "techguru",
        "name": "Tech Guru",
        "profile_pic": "https://example.com/avatars/guru.jpg"
      }
    }
  ]
}
```

---

### 2. Like / Unlike Video
**Purpose**: Add or remove a like from a video

#### Request
```http
POST /api/video/video_screen.php?action=like
POST /api/video/video_screen.php?action=unlike
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | `"like"` or `"unlike"` |
| video_id | string | Yes | 32-character video ID (in request body) |

#### Headers
```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}  # Required
```

#### Request Body
```json
{
  "video_id": "d4bc569e090acbbc17354bd3657adb4d"
}
```

#### Response
```json
{
  "success": true,
  "message": "Video liked",
  "likes": 451,
  "dislikes": 12
}
```

---

### 3. Dislike / Undislike Video
**Purpose**: Add or remove a dislike from a video

#### Request
```http
POST /api/video/video_screen.php?action=dislike
POST /api/video/video_screen.php?action=undislike
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | `"dislike"` or `"undislike"` |
| video_id | string | Yes | 32-character video ID (in request body) |

#### Headers
```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}  # Required
```

#### Request Body
```json
{
  "video_id": "d4bc569e090acbbc17354bd3657adb4d"
}
```

#### Response
```json
{
  "success": true,
  "message": "Video disliked",
  "likes": 450,
  "dislikes": 13
}
```

---

### 4. Add Comment
**Purpose**: Add a comment to a video

#### Request
```http
POST /api/video/video_screen.php?action=comment
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | Must be `"comment"` |

#### Headers
```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}  # Required
```

#### Request Body
```json
{
  "video_id": "d4bc569e090acbbc17354bd3657adb4d",
  "comment": "This is my comment text"
}
```

#### Response
```json
{
  "success": true,
  "message": "Comment added",
  "comment_id": "newcomment123id"
}
```

---

### 5. Subscribe / Unsubscribe
**Purpose**: Subscribe or unsubscribe from the video's channel

#### Request
```http
POST /api/video/video_screen.php?action=subscribe
POST /api/video/video_screen.php?action=unsubscribe
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | `"subscribe"` or `"unsubscribe"` |
| video_id | string | Yes | 32-character video ID (in request body) |

#### Headers
```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}  # Required
```

#### Request Body
```json
{
  "video_id": "d4bc569e090acbbc17354bd3657adb4d"
}
```

#### Response
```json
{
  "success": true,
  "message": "Subscribed successfully",
  "subscriber_count": 15421
}
```

---

### 6. Increment View Count
**Purpose**: Increment the view count for a video (called when video starts playing)

#### Request
```http
POST /api/video/video_screen.php?action=increment_view
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | Must be `"increment_view"` |
| video_id | string | Yes | 32-character video ID (in request body) |

#### Headers
```http
Accept: application/json
Content-Type: application/json
```

#### Request Body
```json
{
  "video_id": "d4bc569e090acbbc17354bd3657adb4d"
}
```

#### Response
```json
{
  "success": true,
  "views": 10524,
  "message": "View counted"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| HTTP Status | Error Message | Description |
|-------------|---------------|-------------|
| 400 | Video ID required | Missing video_id parameter |
| 400 | Invalid action | Action parameter is not valid |
| 400 | Comment text required | Missing or empty comment |
| 400 | Already subscribed | User is already subscribed to channel |
| 400 | You cannot subscribe to your own channel | User tried to subscribe to their own channel |
| 401 | Unauthorized | Authentication required but not provided |
| 404 | Video not found | Video with provided ID doesn't exist |
| 404 | Channel not found | Channel doesn't exist |
| 405 | Method not allowed | Wrong HTTP method used |
| 500 | Database connection failed | Server database error |

---

## Frontend Integration

### React Native Hook Usage

```typescript
import { useVideoScreenData } from "@/hooks/useVideoScreenData";

function VideoScreen({ videoId }: { videoId: string }) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    reactionMutation,
    commentMutation,
    subscriptionMutation,
    viewMutation,
  } = useVideoScreenData(videoId);

  // Access data
  const video = data.video;
  const channel = data.channel;
  const comments = data.comments;
  const recommended = data.related;

  // Perform actions
  const handleLike = () => {
    reactionMutation.mutate('like');
  };

  const handleComment = (text: string) => {
    commentMutation.mutate(text);
  };

  const handleSubscribe = () => {
    subscriptionMutation.mutate('subscribe');
  };

  const handleViewCount = () => {
    viewMutation.mutate(videoId);
  };

  return (
    // Your UI here
  );
}
```

---

## Database Schema

### Required Tables

```sql
-- Videos table
CREATE TABLE videos (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  channel_id CHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  video_url VARCHAR(1024) NOT NULL,
  thumbnail VARCHAR(1024) NOT NULL,
  privacy ENUM('public','private','unlisted','scheduled') DEFAULT 'public',
  views BIGINT DEFAULT 0,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  duration INT DEFAULT 0,
  category VARCHAR(128),
  tags JSON,
  is_short TINYINT(1) DEFAULT 0,
  is_live TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (channel_id) REFERENCES channels(id)
);

-- Channels table
CREATE TABLE channels (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(100) UNIQUE,
  avatar VARCHAR(512),
  banner VARCHAR(512),
  description TEXT,
  subscriber_count INT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Video Likes table
CREATE TABLE video_likes (
  id CHAR(32) PRIMARY KEY,
  video_id CHAR(32) NOT NULL,
  user_id CHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (video_id, user_id)
);

-- Video Comments table
CREATE TABLE video_comments (
  id CHAR(32) PRIMARY KEY,
  video_id CHAR(32) NOT NULL,
  user_id CHAR(32) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  creator_id CHAR(32) NOT NULL,
  notifications TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id) REFERENCES channels(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, creator_id)
);
```

---

## Migration from Old APIs

### Old Endpoint Mapping

| Old Endpoint | New Action | Notes |
|--------------|------------|-------|
| `/api/video/details.php` | `action=fetch` | Now includes channel, comments, recommended |
| `/api/video/comments.php` | `action=fetch` | Comments included in fetch action |
| `/api/video/recommended.php` | `action=fetch` | Recommended included in fetch action |
| `/api/channel/details.php` | `action=fetch` | Channel included in fetch action |
| `/api/video/like.php` | `action=like/unlike` | Same functionality |
| `/api/video/comment.php` | `action=comment` | Same functionality |
| `/api/subscription/subscribe.php` | `action=subscribe` | Works with video_id instead of channel_id |
| `/api/subscription/unsubscribe.php` | `action=unsubscribe` | Works with video_id instead of channel_id |
| `/api/video/view.php` | `action=increment_view` | Same functionality |

### Old APIs (Can be deleted)
- `api/video/details.php`
- `api/video/comments.php`
- `api/video/recommended.php`
- `api/video/like.php` (if not used elsewhere)
- `api/video/comment.php` (if not used elsewhere)
- `api/video/view.php` (if not used elsewhere)

**Note**: Keep `api/subscription/subscribe.php` and `api/subscription/unsubscribe.php` if they are used elsewhere in the app for channel subscription (not through video screen).

---

## Testing

### Test with cURL

#### Fetch video data
```bash
curl -X GET \
  "https://your-domain.com/api/video/video_screen.php?action=fetch&video_id=d4bc569e090acbbc17354bd3657adb4d" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Like a video
```bash
curl -X POST \
  "https://your-domain.com/api/video/video_screen.php?action=like" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"video_id":"d4bc569e090acbbc17354bd3657adb4d"}'
```

#### Add a comment
```bash
curl -X POST \
  "https://your-domain.com/api/video/video_screen.php?action=comment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"video_id":"d4bc569e090acbbc17354bd3657adb4d","comment":"Great video!"}'
```

---

## Performance Considerations

1. **Single Request**: The fetch action gets all data in one request, reducing network overhead
2. **Caching**: Consider implementing Redis/Memcached for frequently accessed videos
3. **Indexes**: Ensure proper indexes on:
   - `videos.id`
   - `video_likes(video_id, user_id)`
   - `video_comments.video_id`
   - `subscriptions(user_id, creator_id)`
4. **Pagination**: Comments are limited to 50, consider adding pagination for videos with many comments
5. **Recommended Videos**: Limited to 20 videos, customize based on your needs

---

## Security Notes

1. **Authentication**: All mutation actions (like, comment, subscribe) require authentication
2. **Input Validation**: All IDs are validated to be 32-character format
3. **SQL Injection**: Uses prepared statements throughout
4. **XSS Prevention**: Sanitize comment text on display
5. **Rate Limiting**: Consider implementing rate limiting for comment and like actions

---

## Support

For issues or questions about this API:
- Check the error message in the response
- Verify ID format (32 characters, no hyphens)
- Ensure proper authentication headers
- Check database schema matches expectations
