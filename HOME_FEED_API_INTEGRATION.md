# Home Feed API Integration Guide

## Overview
The home screen now uses a **real API** to fetch dynamic video content instead of dummy/mock data.

## API Endpoint

### Home Feed API
```
GET https://moviedbr.com/api/video/home_feed.php
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | "All" | Filter by category (All, Technology, Gaming, Food, Fitness, Music, Education, Entertainment, News, Sports) |
| `limit` | integer | No | 20 | Number of videos to fetch (1-100) |
| `offset` | integer | No | 0 | Pagination offset |

### Request Example
```bash
curl "https://moviedbr.com/api/video/home_feed.php?category=All&limit=20"
```

### Response Format
```json
{
  "success": true,
  "videos": [
    {
      "id": "2814327a9b2342854aeb6b6e4d7e3739",
      "title": "Sample Video Title",
      "description": "Video description",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "videoUrl": "https://example.com/video.mp4",
      "channelId": "c1234567890123456789012345678901",
      "channelName": "Channel Name",
      "channelAvatar": "https://example.com/avatar.jpg",
      "views": 1500,
      "likes": 120,
      "uploadDate": "2025-01-15T10:00:00Z",
      "duration": 600,
      "category": "Technology",
      "isShort": false
    }
  ],
  "shorts": [
    {
      "id": "s123456789012345678901234567890ab",
      "title": "Short Video Title",
      "thumbnail": "https://example.com/short-thumb.jpg",
      "videoUrl": "https://example.com/short.mp4",
      "channelId": "c1234567890123456789012345678901",
      "channelName": "Channel Name",
      "channelAvatar": "https://example.com/avatar.jpg",
      "views": 850,
      "likes": 45,
      "uploadDate": "2025-01-15T12:00:00Z",
      "duration": 45,
      "category": "Technology",
      "isShort": true
    }
  ],
  "total": 15,
  "category": "All"
}
```

## Frontend Integration

### Files Modified
1. **app/(tabs)/home.tsx** - Updated to fetch from real API
2. **api/video/home_feed.php** - New API endpoint created

### Key Changes

#### 1. Removed Mock Data Dependency
- Removed import from `mocks/data.ts`
- Videos and shorts now fetched from database

#### 2. Added API Fetch Function
```typescript
const fetchHomeFeed = async (category: string = "All") => {
  try {
    setLoading(true);
    const baseUrl = getEnvApiBaseUrl();
    const url = `${baseUrl}/api/video/home_feed.php?category=${encodeURIComponent(category)}&limit=20`;
    
    const response = await fetch(url);
    const data: HomeFeedResponse = await response.json();
    
    if (data.success) {
      setVideos(data.videos || []);
      setShorts(data.shorts || []);
    }
  } catch (error) {
    console.error('[HomeScreen] Error fetching home feed:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. Category Filtering
- When user selects a category, API is called with category parameter
- API filters videos server-side for better performance

#### 4. Pull-to-Refresh
- Integrated with `RefreshControl`
- Fetches fresh data on pull down

#### 5. Loading States
- Shows loading spinner while fetching
- Shows "No videos available" if empty
- Proper error handling

## Video Click Navigation

When user clicks on a video:
```typescript
// Regular video
router.push(`/video/${item.id}`)
// Navigates to: /video/2814327a9b2342854aeb6b6e4d7e3739

// Short video
router.push(`/shorts/${item.id}`)
// Navigates to: /shorts/s123456789012345678901234567890ab
```

### Video Screen API Integration
The video screen uses the unified video screen API:
```
GET https://moviedbr.com/api/video/video_screen.php?action=fetch&video_id={32-char-id}
```

This API provides:
- Video details
- Channel information
- Comments
- Recommended videos
- Like/subscribe status

## ID Format

### Important: All IDs are 32-character format
```
✓ Correct: 2814327a9b2342854aeb6b6e4d7e3739
✗ Wrong:   2814327a-9b23-4285-4aeb-6b6e4d7e3739
```

### ID Types
- **video_id**: 32 characters (videos table)
- **channel_id**: 32 characters (channels table)
- **user_id**: 32 characters (users table)

## Database Schema

### Videos Table
```sql
SELECT 
  v.video_id,           -- 32-char ID
  v.title,
  v.description,
  v.thumbnail_url,
  v.video_url,
  v.views,
  v.likes,
  v.duration,
  v.category,
  v.created_at,
  v.is_short,
  v.privacy             -- public/private/unlisted
FROM videos v
WHERE v.privacy = 'public'
```

## Testing

### 1. Test Home Feed
```bash
curl "https://moviedbr.com/api/video/home_feed.php"
```

### 2. Test Category Filter
```bash
curl "https://moviedbr.com/api/video/home_feed.php?category=Technology"
```

### 3. Test Pagination
```bash
curl "https://moviedbr.com/api/video/home_feed.php?limit=10&offset=10"
```

### 4. Test Video Navigation
Click any video → Should navigate to video screen with ID:
```
https://moviedbr.com/api/video/video_screen.php?action=fetch&video_id={id}
```

## Features

### ✅ Implemented
- [x] Dynamic video loading from API
- [x] Category filtering
- [x] Shorts section
- [x] Pull-to-refresh
- [x] Loading states
- [x] Error handling
- [x] Video click navigation
- [x] 32-character ID format support

### 🎯 Behavior
1. Home screen loads → API fetches videos
2. User selects category → API refetches with filter
3. User pulls down → Data refreshes
4. User clicks video → Navigates with correct 32-char ID
5. Video screen → Uses video_screen.php API

## Console Logs

For debugging, check browser console:
```
[HomeScreen] Fetching home feed: https://moviedbr.com/api/video/home_feed.php?category=All&limit=20
[HomeScreen] Home feed response: { success: true, videos: [...], shorts: [...] }
```

## Error Handling

### No Videos Available
- Shows "No videos available" message
- User can pull to refresh

### Network Error
- Logs error to console
- Shows empty state
- User can retry with pull-to-refresh

### Invalid Response
- Gracefully handles with empty arrays
- Prevents app crash

## Summary

✅ **Home screen now fully dynamic**
✅ **All dummy data removed**
✅ **Real API integration complete**
✅ **32-character ID format consistent**
✅ **Video navigation works correctly**
✅ **Integrates with video_screen.php API**

The home screen is now production-ready with real data from your database!
