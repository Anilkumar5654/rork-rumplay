# PlayTube Complete API Documentation

**Base URL:** `https://moviedbr.com/api/`

All API endpoints use JSON format for requests and responses unless otherwise specified (multipart/form-data for file uploads).

---

## ⚠️ Important: ID Formats & Authentication

### ID Format Specification
All IDs in this system use **UUID v4 format** (36 characters including hyphens):
- **Format**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- **Example**: `550e8400-e29b-41d4-a716-446655440000`
- **Length**: 36 characters (32 hex digits + 4 hyphens)

This applies to:
- User IDs
- Channel IDs
- Video IDs
- Comment IDs
- All other entity IDs

### Authentication Types

#### 🔓 Optional Authentication
These endpoints work without authentication but provide enhanced data when authenticated:
- `GET /video/details.php` - Basic info without auth, includes `is_liked`, `is_saved` flags with auth
- `GET /channel/details.php` - Basic info without auth, includes `is_subscribed` flag with auth
- `GET /video/list.php` - Public videos without auth, personalized with auth

#### 🔒 Required Authentication
These endpoints require a valid Bearer token:
- All `POST` endpoints (except login/register)
- All `/admin/*` endpoints
- `GET /auth/me`
- Video upload, like, comment endpoints
- Subscription management

#### 🌐 Public (No Auth)
These endpoints are completely public:
- `POST /auth/login`
- `POST /auth/register`
- `GET /health.php`

### Authentication Header Format
```
Authorization: Bearer {your_session_token}
```

**See [API_ID_FORMAT.md](./API_ID_FORMAT.md) for detailed ID format and authentication documentation.**

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Videos](#videos)
4. [Shorts](#shorts)
5. [Comments](#comments)
6. [Subscriptions](#subscriptions)
7. [Channels](#channels)
8. [Search](#search)
9. [Admin](#admin)
10. [Error Handling](#error-handling)

---

## 🔐 Authentication

### 1. Register
**Endpoint:** `POST /auth/register.php`

Creates a new user account and automatically creates a channel.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "john_doe",
  "displayName": "John Doe"
}
```

**Required Fields:**
- `email` (string, valid email format)
- `password` (string, min 6 characters)
- `username` (string, 3-64 characters, alphanumeric + underscore)
- `displayName` (string, optional, defaults to username)

**Success Response (200):**
```json
{
  "success": true,
  "token": "session_token_here",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "name": "John Doe",
    "email": "user@example.com",
    "profile_pic": "",
    "bio": "",
    "phone": "",
    "role": "user",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-01-15 12:00:00"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Email or username already exists"
}
```

---

### 2. Login
**Endpoint:** `POST /auth/login.php`

Authenticates a user and returns a session token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Required Fields:**
- `email` (string, valid email)
- `password` (string)

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "name": "John Doe",
    "email": "user@example.com",
    "profile_pic": "https://moviedbr.com/uploads/profiles/abc123.jpg",
    "bio": "Content creator",
    "phone": "+1234567890",
    "role": "user",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "subscriptions": ["channel_id_1", "channel_id_2"],
    "liked_videos": ["video_id_1", "video_id_2"],
    "created_at": "2025-01-01 12:00:00"
  }
}
```

---

### 3. Get Current User
**Endpoint:** `GET /auth/me.php`

Returns the authenticated user's data.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "name": "John Doe",
    "email": "user@example.com",
    "profile_pic": "https://moviedbr.com/uploads/profiles/abc123.jpg",
    "bio": "Content creator and developer",
    "phone": "+1234567890",
    "role": "user",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "subscriptions": ["channel_id_1"],
    "watch_history": ["video_id_1", "video_id_2"],
    "liked_videos": ["video_id_1"],
    "saved_videos": ["video_id_3"],
    "created_at": "2025-01-01 12:00:00"
  }
}
```

---

### 4. Logout
**Endpoint:** `POST /auth/logout.php`

Invalidates the current session token.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👤 User Profile

### 5. Get User Profile
**Endpoint:** `GET /user/profile.php?user_id={user_id}`

Retrieves a user's public profile information.

**Query Parameters:**
- `user_id` (string, required) - User UUID

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "name": "John Doe",
    "profile_pic": "https://moviedbr.com/uploads/profiles/abc123.jpg",
    "bio": "Content creator",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-01-01 12:00:00"
  }
}
```

---

### 6. Get User Details (Own Profile)
**Endpoint:** `GET /user/details.php`

Returns detailed information about the authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "name": "John Doe",
    "email": "user@example.com",
    "profile_pic": "https://moviedbr.com/uploads/profiles/abc123.jpg",
    "bio": "Content creator and developer",
    "phone": "+1234567890",
    "role": "user",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "subscriptions": ["channel_id_1", "channel_id_2"],
    "watch_history": ["video_id_1", "video_id_2", "video_id_3"],
    "liked_videos": ["video_id_1", "video_id_4"],
    "saved_videos": ["video_id_5"],
    "created_at": "2025-01-01 12:00:00",
    "updated_at": "2025-01-15 10:30:00"
  }
}
```

---

### 7. Update User Profile
**Endpoint:** `POST /user/update.php`

Updates the authenticated user's profile information.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, optional) - Display name
- `bio` (string, optional) - User bio
- `phone` (string, optional) - Phone number
- `profile_pic` (file, optional) - Profile picture (JPEG, PNG, max 5MB)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "name": "John Doe Updated",
    "email": "user@example.com",
    "profile_pic": "https://moviedbr.com/uploads/profiles/new_abc123.jpg",
    "bio": "Content creator and developer",
    "phone": "+1234567890",
    "role": "user",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-01-01 12:00:00",
    "updated_at": "2025-01-15 14:22:00"
  }
}
```

---

### 8. Get User Uploads
**Endpoint:** `GET /user/uploads.php`

Retrieves all videos uploaded by the authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "channel_id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "My Awesome Video",
      "description": "This is a test video",
      "video_url": "https://moviedbr.com/uploads/videos/video123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/thumb123.jpg",
      "views": 1250,
      "likes": 85,
      "dislikes": 3,
      "privacy": "public",
      "category": "Technology",
      "tags": ["tech", "tutorial", "coding"],
      "duration": 360,
      "is_short": 0,
      "created_at": "2025-01-10 15:30:00",
      "updated_at": "2025-01-15 10:00:00"
    }
  ]
}
```

---

## 🎥 Videos

### 9. Upload Video
**Endpoint:** `POST /video/upload.php`

Uploads a new video with optional thumbnail.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `video` (file, **required**) - Video file (MP4, MOV, AVI, max 500MB)
- `thumbnail` (file, optional) - Thumbnail image (JPEG, PNG, max 5MB)
- `title` (string, **required**) - Video title
- `description` (string, optional) - Video description
- `category` (string, optional) - Video category (default: "Other")
- `tags` (string, optional) - Comma-separated tags (e.g., "tech,tutorial,coding")
- `privacy` (string, optional) - Privacy setting: `public`, `private`, `unlisted`, `scheduled` (default: "public")
- `is_short` (int, optional) - 0 or 1 (default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "video_id": "770e8400-e29b-41d4-a716-446655440000",
  "video_url": "https://moviedbr.com/uploads/videos/video123.mp4",
  "thumbnail_url": "https://moviedbr.com/uploads/thumbnails/thumb123.jpg",
  "message": "Video uploaded successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Video file and title are required"
}
```

```json
{
  "success": false,
  "error": "Channel not found. Please create a channel first."
}
```

---

### 10. Get Video List (Home Feed)
**Endpoint:** `GET /video/list.php`

Retrieves a paginated list of public videos.

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Videos per page (default: 20, max: 100)
- `category` (string, optional) - Filter by category
- `sort` (string, optional) - Sort by: `latest`, `trending`, `views` (default: `latest`)

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "channel_id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Amazing Tech Tutorial",
      "description": "Learn how to code in 10 minutes",
      "video_url": "https://moviedbr.com/uploads/videos/video123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/thumb123.jpg",
      "views": 15000,
      "likes": 850,
      "dislikes": 15,
      "privacy": "public",
      "category": "Technology",
      "tags": ["tech", "tutorial", "coding"],
      "duration": 600,
      "is_short": 0,
      "created_at": "2025-01-10 14:30:00",
      "uploader": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "tech_guru",
        "name": "Tech Guru",
        "profile_pic": "https://moviedbr.com/uploads/profiles/guru123.jpg",
        "channel_id": "660e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 15,
    "total_videos": 300,
    "limit": 20
  }
}
```

---

### 11. Get Video Details
**Endpoint:** `GET /video/details.php?video_id={video_id}`

Retrieves detailed information about a specific video.

**Query Parameters:**
- `video_id` (string, **required**) - Video UUID

**Success Response (200):**
```json
{
  "success": true,
  "video": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "channel_id": "660e8400-e29b-41d4-a716-446655440000",
    "title": "Amazing Tech Tutorial",
    "description": "Learn how to code in 10 minutes. This comprehensive tutorial covers...",
    "video_url": "https://moviedbr.com/uploads/videos/video123.mp4",
    "thumbnail": "https://moviedbr.com/uploads/thumbnails/thumb123.jpg",
    "views": 15230,
    "likes": 852,
    "dislikes": 15,
    "privacy": "public",
    "category": "Technology",
    "tags": ["tech", "tutorial", "coding"],
    "duration": 600,
    "is_short": 0,
    "created_at": "2025-01-10 14:30:00",
    "updated_at": "2025-01-15 10:00:00",
    "uploader": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "tech_guru",
      "name": "Tech Guru",
      "profile_pic": "https://moviedbr.com/uploads/profiles/guru123.jpg",
      "channel_id": "660e8400-e29b-41d4-a716-446655440000"
    },
    "comments_count": 127,
    "is_liked": false,
    "is_saved": false
  }
}
```

---

### 12. Increment Video View
**Endpoint:** `POST /video/view.php`

Increments the view count for a video.

**Headers:**
```
Authorization: Bearer {token} (optional)
```

**Request Body:**
```json
{
  "video_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "views": 15231,
  "message": "View counted"
}
```

---

### 13. Like Video
**Endpoint:** `POST /video/like.php`

Likes or unlikes a video.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "video_id": "770e8400-e29b-41d4-a716-446655440000",
  "action": "like"
}
```

**Action Values:**
- `like` - Add like to video
- `unlike` - Remove like from video
- `dislike` - Add dislike to video
- `undislike` - Remove dislike from video

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video liked",
  "likes": 853,
  "dislikes": 15
}
```

---

### 14. Get Trending Videos
**Endpoint:** `GET /video/trending.php`

Returns trending videos based on views, likes, and recency.

**Query Parameters:**
- `limit` (int, optional) - Number of videos (default: 20, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Viral Video Title",
      "video_url": "https://moviedbr.com/uploads/videos/viral123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/viral123.jpg",
      "views": 1000000,
      "likes": 85000,
      "dislikes": 500,
      "duration": 420,
      "created_at": "2025-01-14 10:00:00",
      "uploader": {
        "username": "viral_creator",
        "name": "Viral Creator",
        "profile_pic": "https://moviedbr.com/uploads/profiles/creator123.jpg"
      }
    }
  ]
}
```

---

### 15. Get Recommended Videos
**Endpoint:** `GET /video/recommended.php`

Returns personalized video recommendations for the user.

**Headers:**
```
Authorization: Bearer {token} (optional)
```

**Query Parameters:**
- `limit` (int, optional) - Number of videos (default: 20, max: 50)
- `video_id` (string, optional) - Current video ID for related videos

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "title": "Related Video Title",
      "video_url": "https://moviedbr.com/uploads/videos/related123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/related123.jpg",
      "views": 25000,
      "likes": 1200,
      "duration": 480,
      "category": "Technology",
      "uploader": {
        "username": "tech_creator",
        "name": "Tech Creator",
        "profile_pic": "https://moviedbr.com/uploads/profiles/tech123.jpg"
      }
    }
  ]
}
```

---

## 🎬 Shorts

### 16. Get Shorts List
**Endpoint:** `GET /shorts/list.php`

Retrieves a list of short videos (videos with `is_short = 1`).

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Shorts per page (default: 20, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "shorts": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "channel_id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Quick Tutorial",
      "description": "Learn this trick in 30 seconds",
      "video_url": "https://moviedbr.com/uploads/videos/short123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/short123.jpg",
      "views": 50000,
      "likes": 3500,
      "dislikes": 50,
      "is_short": 1,
      "duration": 30,
      "category": "Education",
      "tags": ["quick", "tutorial"],
      "created_at": "2025-01-15 16:45:00",
      "uploader": {
        "username": "short_creator",
        "name": "Short Creator",
        "profile_pic": "https://moviedbr.com/uploads/profiles/short123.jpg",
        "channel_id": "660e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 25,
    "total_shorts": 500,
    "limit": 20
  }
}
```

---

### 17. Upload Short
**Endpoint:** `POST /shorts/upload.php`

Uploads a short video (same endpoint as regular video upload).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- Same as `/video/upload.php`
- `is_short` is automatically set to 1
- Video duration should be ≤ 60 seconds

**Success Response (200):**
```json
{
  "success": true,
  "video_id": "990e8400-e29b-41d4-a716-446655440000",
  "video_url": "https://moviedbr.com/uploads/videos/short123.mp4",
  "thumbnail_url": "https://moviedbr.com/uploads/thumbnails/short123.jpg",
  "message": "Short uploaded successfully"
}
```

---

## 💬 Comments

### 18. Add Comment
**Endpoint:** `POST /video/comment.php`

Adds a comment to a video.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "video_id": "770e8400-e29b-41d4-a716-446655440000",
  "comment": "Great video! Very helpful."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "comment_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "message": "Comment added successfully"
}
```

---

### 19. Get Video Comments
**Endpoint:** `GET /video/comments.php?video_id={video_id}`

Retrieves all comments for a video.

**Query Parameters:**
- `video_id` (string, **required**) - Video UUID
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Comments per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "comments": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "video_id": "770e8400-e29b-41d4-a716-446655440000",
      "user_id": "bb0e8400-e29b-41d4-a716-446655440000",
      "comment": "Great video! Very helpful.",
      "created_at": "2025-01-15 18:30:00",
      "user": {
        "username": "commenter123",
        "name": "John Commenter",
        "profile_pic": "https://moviedbr.com/uploads/profiles/commenter123.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 7,
    "total_comments": 127
  }
}
```

---

### 20. Delete Comment
**Endpoint:** `DELETE /video/comment.php`

Deletes a comment (only comment author or admin).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "comment_id": "aa0e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## 📺 Channels

### 21. Get Channel Details
**Endpoint:** `GET /channel/details.php?channel_id={channel_id}`

Retrieves detailed information about a channel.

**Query Parameters:**
- `channel_id` (string, **required**) - Channel UUID

**Success Response (200):**
```json
{
  "success": true,
  "channel": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Guru Channel",
    "handle": "@techguru",
    "avatar": "https://moviedbr.com/uploads/profiles/guru123.jpg",
    "banner": "https://moviedbr.com/uploads/banners/guru_banner.jpg",
    "description": "Tech tutorials and reviews",
    "subscriber_count": 125000,
    "total_views": 5000000,
    "verified": 1,
    "created_at": "2024-06-15 10:00:00",
    "video_count": 450,
    "is_subscribed": false
  }
}
```

---

### 22. Get Channel Videos
**Endpoint:** `GET /channel/videos.php?channel_id={channel_id}`

Retrieves all public videos from a channel.

**Query Parameters:**
- `channel_id` (string, **required**) - Channel UUID
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Videos per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Latest Tech Review",
      "video_url": "https://moviedbr.com/uploads/videos/review123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/review123.jpg",
      "views": 25000,
      "likes": 1500,
      "duration": 720,
      "created_at": "2025-01-14 12:00:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 23,
    "total_videos": 450
  }
}
```

---

### 23. Update Channel
**Endpoint:** `POST /channel/update.php`

Updates channel information (channel owner only).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, optional) - Channel name
- `description` (string, optional) - Channel description
- `avatar` (file, optional) - Channel avatar (JPEG, PNG, max 5MB)
- `banner` (file, optional) - Channel banner (JPEG, PNG, max 10MB)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Channel updated successfully",
  "channel": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Guru Channel Updated",
    "description": "Best tech content on the platform",
    "avatar": "https://moviedbr.com/uploads/profiles/new_guru123.jpg",
    "banner": "https://moviedbr.com/uploads/banners/new_banner.jpg",
    "updated_at": "2025-01-15 20:00:00"
  }
}
```

---

## 🔔 Subscriptions

### 24. Subscribe to Channel
**Endpoint:** `POST /subscription/subscribe.php`

Subscribes to a channel.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "channel_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subscribed successfully",
  "subscriber_count": 125001
}
```

---

### 25. Unsubscribe from Channel
**Endpoint:** `POST /subscription/unsubscribe.php`

Unsubscribes from a channel.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "channel_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unsubscribed successfully",
  "subscriber_count": 125000
}
```

---

### 26. Get User Subscriptions
**Endpoint:** `GET /subscription/list.php`

Returns all channels the user is subscribed to.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "subscriptions": [
    {
      "channel_id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Tech Guru Channel",
      "handle": "@techguru",
      "avatar": "https://moviedbr.com/uploads/profiles/guru123.jpg",
      "subscriber_count": 125000,
      "subscribed_at": "2024-12-01 10:00:00"
    }
  ]
}
```

---

### 27. Get Subscription Feed
**Endpoint:** `GET /subscription/feed.php`

Returns latest videos from subscribed channels.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Videos per page (default: 20, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "New Video from Subscribed Channel",
      "video_url": "https://moviedbr.com/uploads/videos/sub123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/sub123.jpg",
      "views": 5000,
      "likes": 350,
      "duration": 480,
      "created_at": "2025-01-15 10:00:00",
      "uploader": {
        "username": "subscribed_creator",
        "name": "Subscribed Creator",
        "profile_pic": "https://moviedbr.com/uploads/profiles/sub123.jpg",
        "channel_id": "660e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 8,
    "total_videos": 156
  }
}
```

---

## 🔍 Search

### 28. Search Videos
**Endpoint:** `GET /video/search.php`

Searches for videos by title, description, or tags.

**Query Parameters:**
- `q` (string, **required**) - Search query
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Results per page (default: 20, max: 50)
- `category` (string, optional) - Filter by category

**Success Response (200):**
```json
{
  "success": true,
  "query": "javascript tutorial",
  "videos": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "title": "Complete JavaScript Tutorial 2025",
      "description": "Learn JavaScript from scratch...",
      "video_url": "https://moviedbr.com/uploads/videos/js_tutorial.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/js_tutorial.jpg",
      "views": 50000,
      "likes": 3200,
      "duration": 3600,
      "category": "Education",
      "created_at": "2025-01-05 09:00:00",
      "uploader": {
        "username": "js_expert",
        "name": "JS Expert",
        "profile_pic": "https://moviedbr.com/uploads/profiles/js123.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_results": 98
  }
}
```

---

### 29. Search Channels
**Endpoint:** `GET /channel/search.php`

Searches for channels by name or handle.

**Query Parameters:**
- `q` (string, **required**) - Search query
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Results per page (default: 20, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "query": "tech",
  "channels": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Tech Guru Channel",
      "handle": "@techguru",
      "avatar": "https://moviedbr.com/uploads/profiles/guru123.jpg",
      "description": "Tech tutorials and reviews",
      "subscriber_count": 125000,
      "video_count": 450,
      "verified": 1
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_results": 42
  }
}
```

---

## 🎯 Watch History & Saved Videos

### 30. Add to Watch History
**Endpoint:** `POST /user/watch-history.php`

Adds a video to user's watch history.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "video_id": "770e8400-e29b-41d4-a716-446655440000",
  "watch_duration": 120
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Added to watch history"
}
```

---

### 31. Get Watch History
**Endpoint:** `GET /user/watch-history.php`

Returns user's watch history.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Videos per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "history": [
    {
      "video_id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Watched Video",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/watched123.jpg",
      "duration": 600,
      "watch_duration": 450,
      "watched_at": "2025-01-15 19:30:00",
      "uploader": {
        "username": "creator123",
        "name": "Video Creator",
        "profile_pic": "https://moviedbr.com/uploads/profiles/creator123.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 12,
    "total_videos": 234
  }
}
```

---

### 32. Save Video
**Endpoint:** `POST /user/save-video.php`

Saves a video to watch later.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "video_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video saved successfully"
}
```

---

### 33. Get Saved Videos
**Endpoint:** `GET /user/saved-videos.php`

Returns user's saved videos.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "saved_videos": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "title": "Saved Video Title",
      "video_url": "https://moviedbr.com/uploads/videos/saved123.mp4",
      "thumbnail": "https://moviedbr.com/uploads/thumbnails/saved123.jpg",
      "views": 10000,
      "duration": 420,
      "saved_at": "2025-01-14 12:00:00",
      "uploader": {
        "username": "creator456",
        "name": "Another Creator"
      }
    }
  ]
}
```

---

## 👑 Admin

### 34. Get All Users (Admin Only)
**Endpoint:** `GET /admin/users.php`

Retrieves all users (requires admin role).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Users per page (default: 50, max: 200)
- `role` (string, optional) - Filter by role

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user",
      "channel_id": "660e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-01-01 12:00:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 20,
    "total_users": 1000
  }
}
```

---

### 35. Get All Videos (Admin Only)
**Endpoint:** `GET /admin/videos.php`

Retrieves all videos with moderation options.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int, optional) - Page number (default: 1)
- `limit` (int, optional) - Videos per page (default: 50, max: 200)
- `privacy` (string, optional) - Filter by privacy

**Success Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "Video Title",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "channel_id": "660e8400-e29b-41d4-a716-446655440000",
      "privacy": "public",
      "views": 1000,
      "likes": 50,
      "category": "Entertainment",
      "created_at": "2025-01-10 10:00:00",
      "uploader": {
        "username": "uploader123",
        "email": "uploader@example.com"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 50,
    "total_videos": 2500
  }
}
```

---

### 36. Delete Video (Admin Only)
**Endpoint:** `DELETE /admin/video.php`

Deletes a video (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "video_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

### 37. Update User Role (Admin Only)
**Endpoint:** `POST /admin/update-role.php`

Updates a user's role.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "creator"
}
```

**Allowed Roles:**
- `user` - Regular user
- `creator` - Content creator
- `admin` - Administrator
- `super_admin` - Super administrator

**Success Response (200):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "role": "creator"
  }
}
```

---

## ❌ Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Invalid or missing authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Wrong HTTP method used |
| 413 | Payload Too Large | File size exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## 🔒 Authentication Flow

1. **Register/Login** → Receive `token`
2. **Store Token** → Save in secure storage (AsyncStorage)
3. **Include Token** → Add to Authorization header:
   ```
   Authorization: Bearer {token}
   ```
4. **Handle 401** → Redirect to login on unauthorized
5. **Logout** → Clear token and invalidate session

---

## 📁 File Upload Guidelines

### Video Files
- **Formats:** MP4, MOV, AVI
- **Max Size:** 500MB
- **Codec:** H.264 recommended
- **Resolution:** 1080p or lower recommended
- **Shorts Duration:** ≤ 60 seconds

### Image Files
- **Formats:** JPEG, PNG
- **Profile Pictures:** Max 5MB, recommended 500x500px
- **Thumbnails:** Max 5MB, recommended 1280x720px
- **Banners:** Max 10MB, recommended 2560x1440px

### Upload Directory Structure
```
uploads/
├── videos/          # All video files (regular + shorts)
├── thumbnails/      # Video thumbnails
├── profiles/        # User profile pictures
└── banners/         # Channel banners
```

---

## 🌐 Frontend Integration

### Base Configuration
```typescript
const API_BASE_URL = 'https://moviedbr.com/api';
const MEDIA_BASE_URL = 'https://moviedbr.com/uploads';
```

### Example: Fetch Videos
```typescript
async function getVideos(page = 1, limit = 20) {
  const response = await fetch(
    `${API_BASE_URL}/video/list.php?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data;
}
```

### Example: Upload Video
```typescript
async function uploadVideo(videoFile: File, title: string, description: string) {
  const token = await AsyncStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('video', {
    uri: videoFile.uri,
    name: 'video.mp4',
    type: 'video/mp4',
  });
  formData.append('title', title);
  formData.append('description', description);
  formData.append('privacy', 'public');
  formData.append('category', 'Other');
  
  const response = await fetch(`${API_BASE_URL}/video/upload.php`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data;
}
```

### Example: Like Video
```typescript
async function likeVideo(videoId: string) {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/video/like.php`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_id: videoId,
      action: 'like',
    }),
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data;
}
```

---

## 📊 Database Schema Reference

### Users Table
```sql
id, username, name, email, password_hash, password_salt, 
profile_pic, bio, phone, role, channel_id, subscriptions,
watch_history, liked_videos, saved_videos, created_at, updated_at
```

### Videos Table
```sql
id, user_id, channel_id, title, description, video_url, 
thumbnail, views, likes, dislikes, privacy, category, tags, 
duration, is_short, created_at, updated_at
```

### Channels Table
```sql
id, user_id, name, handle, avatar, banner, description,
subscriber_count, total_views, verified, created_at, updated_at
```

### Sessions Table
```sql
token, user_id, expires_at, created_at
```

### Video Likes Table
```sql
id, video_id, user_id, created_at
```

### Video Comments Table
```sql
id, video_id, user_id, comment, created_at
```

### Subscriptions Table
```sql
id, user_id, creator_id (channel_id), notifications, created_at
```

---

## 📝 Important Notes

1. **Channel ID Requirement**: Users must have a `channel_id` to upload videos. This is automatically created during registration.

2. **Shorts vs Regular Videos**: Shorts are stored in the same `videos` table with `is_short = 1`. No separate table needed.

3. **File Paths**: All media files use absolute URLs:
   - Videos: `https://moviedbr.com/uploads/videos/{filename}`
   - Thumbnails: `https://moviedbr.com/uploads/thumbnails/{filename}`
   - Profiles: `https://moviedbr.com/uploads/profiles/{filename}`

4. **Token Expiry**: Session tokens expire after 30 days. Handle 401 errors by redirecting to login.

5. **Privacy Levels**:
   - `public`: Visible to everyone
   - `private`: Only visible to uploader
   - `unlisted`: Accessible via direct link only
   - `scheduled`: Will be public at scheduled date

6. **Rate Limiting**: Implement client-side rate limiting for:
   - Video uploads: Max 10 per hour
   - Comments: Max 50 per hour
   - API requests: Max 100 per minute

---

## 🆘 Support & Troubleshooting

### Common Issues

**Upload Fails:**
- Check file size limits
- Verify file format
- Ensure user has `channel_id`
- Check upload directory permissions (755)

**401 Unauthorized:**
- Token expired or invalid
- Token not included in header
- User logged out

**Video Not Playing:**
- Verify video URL is accessible
- Check video format compatibility
- Ensure video file exists on server

---

**Last Updated:** January 2025  
**API Version:** 1.0.0  
**Support:** https://moviedbr.com/support
