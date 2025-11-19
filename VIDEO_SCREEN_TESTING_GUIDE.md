# Video Screen API - Testing Guide

## 🧪 Complete Testing Checklist

Use this guide to thoroughly test the new consolidated Video Screen API.

---

## Prerequisites

Before testing, ensure you have:
- ✅ Database tables created (see `VIDEO_SCREEN_SCHEMA.sql`)
- ✅ At least one test user in the database
- ✅ At least one test video with valid channel
- ✅ Valid authentication token for testing protected endpoints
- ✅ API URL configured correctly in your frontend

---

## Test Data Setup

### 1. Create Test User
```sql
INSERT INTO users (id, username, name, email, password_hash, password_salt, role) 
VALUES (
  'testuser01234567890123456789012',  -- 32 chars
  'testuser', 
  'Test User', 
  'test@example.com', 
  'test_hash', 
  'test_salt',
  'user'
);
```

### 2. Create Test Channel
```sql
INSERT INTO channels (id, user_id, name, handle, description, subscriber_count, verified) 
VALUES (
  'channel01234567890123456789012',  -- 32 chars
  'testuser01234567890123456789012',
  'Test Channel',
  '@testchannel',
  'This is a test channel',
  0,
  0
);
```

### 3. Create Test Video
```sql
INSERT INTO videos (
  id, 
  user_id, 
  channel_id, 
  title, 
  description, 
  video_url, 
  thumbnail,
  category,
  tags,
  duration,
  views,
  likes,
  dislikes,
  privacy
) VALUES (
  'video001234567890123456789012',  -- 32 chars
  'testuser01234567890123456789012',
  'channel01234567890123456789012',
  'Test Video Title',
  'This is a test video description',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://picsum.photos/1280/720',
  'Testing',
  '["test","demo","api"]',
  300,
  0,
  0,
  0,
  'public'
);
```

---

## API Testing with cURL

### Test 1: Fetch Video Data (GET)

**Purpose**: Verify that fetching video data works and returns all required information

```bash
curl -X GET \
  "http://localhost/api/video/video_screen.php?action=fetch&video_id=video001234567890123456789012" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "video": { /* video object */ },
  "channel": { /* channel object */ },
  "comments": [],
  "recommended": []
}
```

**Check**:
- [ ] HTTP 200 status
- [ ] success: true
- [ ] video object contains all fields
- [ ] channel object contains all fields
- [ ] comments array exists (empty is OK)
- [ ] recommended array exists (empty is OK)

---

### Test 2: Fetch with Authentication (GET)

**Purpose**: Verify that is_liked and is_subscribed work when authenticated

```bash
curl -X GET \
  "http://localhost/api/video/video_screen.php?action=fetch&video_id=video001234567890123456789012" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "video": {
    "is_liked": false,
    "is_disliked": false,
    ...
  },
  "channel": {
    "is_subscribed": false,
    ...
  }
}
```

**Check**:
- [ ] is_liked field present in video
- [ ] is_disliked field present in video
- [ ] is_subscribed field present in channel

---

### Test 3: Like Video (POST)

**Purpose**: Verify like functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=like" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Video liked",
  "likes": 1,
  "dislikes": 0
}
```

**Check**:
- [ ] HTTP 200 status
- [ ] success: true
- [ ] likes count increased by 1
- [ ] Entry added to video_likes table

**Verify in Database**:
```sql
SELECT * FROM video_likes WHERE video_id = 'video001234567890123456789012';
SELECT likes FROM videos WHERE id = 'video001234567890123456789012';
```

---

### Test 4: Unlike Video (POST)

**Purpose**: Verify unlike functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=unlike" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Video unliked",
  "likes": 0,
  "dislikes": 0
}
```

**Check**:
- [ ] likes count decreased by 1
- [ ] Entry removed from video_likes table

---

### Test 5: Dislike Video (POST)

**Purpose**: Verify dislike functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=dislike" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Video disliked",
  "likes": 0,
  "dislikes": 1
}
```

**Check**:
- [ ] dislikes count increased by 1

---

### Test 6: Add Comment (POST)

**Purpose**: Verify comment functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=comment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012","comment":"This is a test comment!"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Comment added",
  "comment_id": "comment0123456789012345678901"
}
```

**Check**:
- [ ] Comment added to database
- [ ] comment_id returned
- [ ] Fetch action now returns this comment

**Verify**:
```sql
SELECT * FROM video_comments WHERE video_id = 'video001234567890123456789012';
```

---

### Test 7: Subscribe to Channel (POST)

**Purpose**: Verify subscription functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=subscribe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Subscribed successfully",
  "subscriber_count": 1
}
```

**Check**:
- [ ] Subscription created in database
- [ ] Channel subscriber_count increased
- [ ] Fetch action now shows is_subscribed: true

**Verify**:
```sql
SELECT * FROM subscriptions WHERE creator_id = 'channel01234567890123456789012';
SELECT subscriber_count FROM channels WHERE id = 'channel01234567890123456789012';
```

---

### Test 8: Unsubscribe from Channel (POST)

**Purpose**: Verify unsubscription functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=unsubscribe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Unsubscribed successfully",
  "subscriber_count": 0
}
```

**Check**:
- [ ] Subscription removed from database
- [ ] Channel subscriber_count decreased

---

### Test 9: Increment View Count (POST)

**Purpose**: Verify view counting functionality

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=increment_view" \
  -H "Content-Type: application/json" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "views": 1,
  "message": "View counted"
}
```

**Check**:
- [ ] Views increased by 1
- [ ] Works without authentication

**Verify**:
```sql
SELECT views FROM videos WHERE id = 'video001234567890123456789012';
```

---

## Error Testing

### Test 10: Missing Video ID

```bash
curl -X GET \
  "http://localhost/api/video/video_screen.php?action=fetch"
```

**Expected**: 
```json
{"success": false, "error": "Video ID required"}
```

**Check**: [ ] HTTP 400 status

---

### Test 11: Invalid Video ID

```bash
curl -X GET \
  "http://localhost/api/video/video_screen.php?action=fetch&video_id=invalid_id"
```

**Expected**: 
```json
{"success": false, "error": "Video not found"}
```

**Check**: [ ] HTTP 404 status

---

### Test 12: Unauthorized Action

```bash
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=like" \
  -H "Content-Type: application/json" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected**: 
```json
{"success": false, "error": "Unauthorized"}
```

**Check**: [ ] HTTP 401 status

---

### Test 13: Invalid Action

```bash
curl -X GET \
  "http://localhost/api/video/video_screen.php?action=invalid_action&video_id=video001234567890123456789012"
```

**Expected**: 
```json
{"success": false, "error": "Invalid action"}
```

**Check**: [ ] HTTP 400 status

---

### Test 14: Double Subscribe

```bash
# Subscribe once
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=subscribe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'

# Subscribe again
curl -X POST \
  "http://localhost/api/video/video_screen.php?action=subscribe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"video_id":"video001234567890123456789012"}'
```

**Expected Second Call**: 
```json
{"success": false, "error": "Already subscribed"}
```

**Check**: [ ] HTTP 400 status

---

## Frontend Testing

### Test 15: Video Screen Load

**Steps**:
1. Open the app
2. Navigate to a video (e.g., tap on video from home)
3. Video screen should open

**Check**:
- [ ] Video player loads
- [ ] Video title displays
- [ ] Channel info displays
- [ ] Like/dislike buttons show
- [ ] Comment section shows
- [ ] Recommended videos show
- [ ] Loading state shows initially
- [ ] No errors in console

---

### Test 16: Like Button

**Steps**:
1. On video screen, tap Like button
2. Like count should increase
3. Tap again to unlike
4. Like count should decrease

**Check**:
- [ ] Like button visual state changes
- [ ] Like count updates immediately (optimistic UI)
- [ ] Changes persist after refresh
- [ ] Button disabled while pending

---

### Test 17: Comment Section

**Steps**:
1. Tap "Comments" header to expand
2. Type a comment in text input
3. Tap send button
4. Comment should appear in list

**Check**:
- [ ] Comment input shows
- [ ] Send button enabled when text present
- [ ] Comment appears after sending
- [ ] Input clears after sending
- [ ] Loading state during submission

---

### Test 18: Subscribe Button

**Steps**:
1. Tap Subscribe button
2. Button should change to "Subscribed"
3. Subscriber count increases
4. Tap again to unsubscribe

**Check**:
- [ ] Button text changes
- [ ] Button style changes
- [ ] Subscriber count updates
- [ ] Changes persist

---

### Test 19: Recommended Videos

**Steps**:
1. Scroll to recommended videos section
2. Tap on a recommended video
3. New video should load

**Check**:
- [ ] Recommended videos displayed
- [ ] Thumbnails load
- [ ] Tapping navigates to new video
- [ ] New video loads correctly

---

### Test 20: Error Handling

**Steps**:
1. Turn off internet connection
2. Try to load video
3. Error message should show
4. Tap retry button

**Check**:
- [ ] Error message displays
- [ ] Retry button works
- [ ] Loading state shows during retry

---

## Performance Testing

### Test 21: Network Performance

**Check**:
- [ ] Initial load makes only 1 API call (not 4+)
- [ ] Page loads in < 2 seconds on good connection
- [ ] No duplicate API calls in network tab
- [ ] Mutations invalidate cache properly

### Test 22: UI Performance

**Check**:
- [ ] No UI jank when scrolling
- [ ] Video player responsive
- [ ] Buttons respond immediately
- [ ] No memory leaks

---

## Edge Cases

### Test 23: Video with No Comments

**Check**:
- [ ] "Be the first to comment" message shows
- [ ] No errors

### Test 24: Video with Many Comments

**Check**:
- [ ] Only 50 comments load (limit)
- [ ] Comments ordered by newest first
- [ ] No performance issues

### Test 25: Own Channel Video

**Steps**:
1. View your own video
2. Try to subscribe

**Check**:
- [ ] Subscribe button disabled/hidden
- [ ] Error if API called

### Test 26: Unauthenticated User

**Steps**:
1. Logout
2. View a video
3. Try to like/comment/subscribe

**Check**:
- [ ] Video loads
- [ ] Like/comment/subscribe require login
- [ ] Proper error messages

---

## Final Verification

### Checklist Summary

- [ ] All 26 tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Database operations correct
- [ ] Authentication working
- [ ] Error handling working
- [ ] Performance acceptable
- [ ] Edge cases handled

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Video ID required" | Ensure video_id is passed in request |
| "Unauthorized" | Check auth token is valid and included |
| Network error | Check API URL is correct |
| CORS error | Add proper CORS headers in PHP |
| Database error | Check all tables exist and IDs match |
| Comments not showing | Verify video_id format is 32 chars |

---

## Performance Benchmarks

**Target Metrics**:
- Initial load: < 2 seconds
- Mutation response: < 500ms
- Video player start: < 1 second
- UI interaction response: < 100ms

**Measure with**:
- Browser DevTools Network tab
- React DevTools Profiler
- Lighthouse performance audit

---

## After Testing

Once all tests pass:
1. ✅ Document any issues found
2. ✅ Remove old API files (if all working)
3. ✅ Update .htaccess if needed
4. ✅ Deploy to staging/production
5. ✅ Monitor logs for errors
6. ✅ Get user feedback

---

**Happy Testing! 🎉**
