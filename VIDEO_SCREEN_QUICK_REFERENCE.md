# Video Screen API - Quick Reference Guide

## 🚀 Quick Start

### API Endpoint
```
https://your-domain.com/api/video/video_screen.php
```

### Frontend Hook
```typescript
import { useVideoScreenData } from "@/hooks/useVideoScreenData";

const { data, reactionMutation, commentMutation, subscriptionMutation } = useVideoScreenData(videoId);
```

---

## 📋 All Actions at a Glance

| Action | Method | Auth Required | Description |
|--------|--------|---------------|-------------|
| `fetch` | GET | Optional | Get video + channel + comments + recommended |
| `like` | POST | ✅ Yes | Like a video |
| `unlike` | POST | ✅ Yes | Remove like from video |
| `dislike` | POST | ✅ Yes | Dislike a video |
| `undislike` | POST | ✅ Yes | Remove dislike from video |
| `comment` | POST | ✅ Yes | Add a comment |
| `subscribe` | POST | ✅ Yes | Subscribe to channel |
| `unsubscribe` | POST | ✅ Yes | Unsubscribe from channel |
| `increment_view` | POST | No | Increment view count |

---

## 🔧 API Usage Examples

### Fetch All Data (GET)
```bash
GET /api/video/video_screen.php?action=fetch&video_id=d4bc569e090acbbc17354bd3657adb4d
```

### Like Video (POST)
```bash
POST /api/video/video_screen.php?action=like
Content-Type: application/json
Authorization: Bearer {token}

{"video_id": "d4bc569e090acbbc17354bd3657adb4d"}
```

### Add Comment (POST)
```bash
POST /api/video/video_screen.php?action=comment
Content-Type: application/json
Authorization: Bearer {token}

{"video_id": "d4bc569e090acbbc17354bd3657adb4d", "comment": "Great video!"}
```

### Subscribe (POST)
```bash
POST /api/video/video_screen.php?action=subscribe
Content-Type: application/json
Authorization: Bearer {token}

{"video_id": "d4bc569e090acbbc17354bd3657adb4d"}
```

---

## 💻 Frontend Integration

### Basic Usage
```typescript
function VideoScreen() {
  const { id } = useLocalSearchParams();
  
  const {
    data,
    isLoading,
    isError,
    reactionMutation,
    commentMutation,
    subscriptionMutation,
  } = useVideoScreenData(id as string);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <View>
      <Text>{data.video?.title}</Text>
      <Text>{data.channel?.name}</Text>
      <Button onPress={() => reactionMutation.mutate('like')}>
        Like ({data.video?.likes})
      </Button>
    </View>
  );
}
```

### Like/Unlike Toggle
```typescript
const handleLike = () => {
  const action = isLiked ? 'unlike' : 'like';
  reactionMutation.mutate(action);
};
```

### Add Comment
```typescript
const handleComment = () => {
  commentMutation.mutate(commentText, {
    onSuccess: () => setCommentText(''),
    onError: (error) => Alert.alert('Error', error.message),
  });
};
```

### Subscribe Toggle
```typescript
const handleSubscribe = () => {
  const action = isSubscribed ? 'unsubscribe' : 'subscribe';
  subscriptionMutation.mutate(action);
};
```

---

## 📊 Response Structure

### Fetch Action Response
```json
{
  "success": true,
  "video": {
    "id": "...",
    "title": "...",
    "description": "...",
    "video_url": "...",
    "thumbnail": "...",
    "views": 10523,
    "likes": 450,
    "dislikes": 12,
    "is_liked": true,
    "uploader": { "id": "...", "username": "...", "name": "..." }
  },
  "channel": {
    "id": "...",
    "name": "...",
    "subscriber_count": 15420,
    "is_subscribed": true
  },
  "comments": [ /* array of comments */ ],
  "recommended": [ /* array of videos */ ]
}
```

### Mutation Response
```json
{
  "success": true,
  "message": "Action successful",
  "likes": 451,  // For like/unlike
  "subscriber_count": 15421,  // For subscribe/unsubscribe
  "comment_id": "..."  // For comment
}
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Video ID required` | Missing video_id | Add video_id parameter |
| `Unauthorized` | No auth token | Add Authorization header |
| `Video not found` | Invalid video_id | Check ID exists in DB |
| `Already subscribed` | User already subscribed | Handle gracefully in UI |
| `Invalid action` | Wrong action parameter | Use valid action name |

---

## 🎯 ID Format

**All IDs must be 32 characters (CHAR(32))**

✅ Correct: `d4bc569e090acbbc17354bd3657adb4d`  
❌ Wrong: `d4bc569e-090a-cbbc-1735-4bd3657adb4d` (has hyphens)

---

## 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `api/video/video_screen.php` | New consolidated API endpoint |
| `hooks/useVideoScreenData.ts` | Updated React Native hook |
| `app/video/[id].tsx` | Updated video screen component |
| `VIDEO_SCREEN_API_INTEGRATION.md` | Complete API documentation |
| `VIDEO_SCREEN_CONSOLIDATION_SUMMARY.md` | Summary of changes |
| `VIDEO_SCREEN_SCHEMA.sql` | Database schema |
| `VIDEO_SCREEN_QUICK_REFERENCE.md` | This file |

---

## ✅ Testing Checklist

- [ ] Video loads with all data
- [ ] Like button works
- [ ] Dislike button works
- [ ] Comments can be added
- [ ] Subscribe button works
- [ ] View count increments
- [ ] Recommended videos show
- [ ] Loading states work
- [ ] Error handling works
- [ ] Authentication required for protected actions

---

## 🔗 Related Documentation

- **Full API Documentation**: `VIDEO_SCREEN_API_INTEGRATION.md`
- **Change Summary**: `VIDEO_SCREEN_CONSOLIDATION_SUMMARY.md`
- **Database Schema**: `VIDEO_SCREEN_SCHEMA.sql`

---

## 🆘 Need Help?

1. Check error message in API response
2. Verify ID format (32 characters)
3. Ensure auth token is included for protected actions
4. Check browser console for frontend errors
5. Refer to full documentation for detailed examples

---

## 🎉 Benefits

✅ **4 API calls → 1** for initial load  
✅ **Faster page load** times  
✅ **Cleaner code** with less boilerplate  
✅ **Better UX** with reduced latency  
✅ **Easier maintenance** with single endpoint  
✅ **Type-safe** with full TypeScript support
