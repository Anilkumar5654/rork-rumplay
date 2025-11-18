# API Troubleshooting Guide

## Quick Fix: "Unauthorized" Error on Video Details

### Problem
Getting error: `[useVideoScreenData] video details failed Unauthorized {"success":false,"error":"Unauthorized"}`

### Root Cause
The `video/details.php` endpoint accepts optional authentication but was returning "Unauthorized" error. This has been fixed in the recent update.

### Solution
The API has been updated to handle authentication errors gracefully:

1. **No token**: Works fine, returns basic video info
2. **Valid token**: Returns enhanced info with `is_liked`, `is_saved`, `is_disliked` flags
3. **Invalid/expired token**: Now fails silently on auth, still returns basic video info

### Verification Steps

#### 1. Check API is accessible
```bash
curl https://moviedbr.com/api/health.php
```

Expected response:
```json
{
  "success": true,
  "message": "API is working"
}
```

#### 2. Test video details without auth
```bash
curl "https://moviedbr.com/api/video/details.php?video_id=YOUR_VIDEO_ID"
```

Expected response: Video details without user-specific flags

#### 3. Test video details with auth
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://moviedbr.com/api/video/details.php?video_id=YOUR_VIDEO_ID"
```

Expected response: Video details with `is_liked`, `is_saved` flags

### Frontend Debugging

Add console logs to your request:

```typescript
console.log('[DEBUG] Fetching video:', videoId);
console.log('[DEBUG] API Root:', apiRoot);
console.log('[DEBUG] Token present:', !!authToken);
console.log('[DEBUG] Request URL:', `${apiRoot}/video/details.php?video_id=${videoId}`);
```

### Common Issues & Fixes

#### Issue 1: Token Format Invalid
**Symptom**: Getting 401 even with token  
**Cause**: Token format is incorrect  
**Fix**: Token should be 96-character hex string  
**Check**: `console.log('Token length:', authToken?.length)`

#### Issue 2: Token Expired
**Symptom**: Was working, now getting 401  
**Cause**: Session expired (30-day limit)  
**Fix**: Log out and log back in

```typescript
// Add this to check token validity
const checkTokenValidity = async () => {
  try {
    const response = await fetch(`${apiRoot}/auth/me.php`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    if (response.status === 401) {
      console.log('Token expired, logging out...');
      await logout();
    }
  } catch (error) {
    console.error('Token check failed:', error);
  }
};
```

#### Issue 3: Wrong Video ID Format
**Symptom**: "Video not found" error  
**Cause**: Video ID not in UUID format  
**Fix**: Ensure ID is UUID v4 (36 characters with hyphens)

```typescript
// Validate UUID format
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

if (!isValidUUID(videoId)) {
  console.error('Invalid video ID format:', videoId);
}
```

#### Issue 4: Database Connection Failed
**Symptom**: 500 error with "Database connection failed"  
**Cause**: Database credentials incorrect or server down  
**Fix**: Contact backend admin, check error logs

#### Issue 5: CORS Issues (Web Only)
**Symptom**: Network error on web, works on mobile  
**Cause**: CORS headers not configured  
**Fix**: Backend already has CORS headers, check browser console

---

## ID Format Issues

### Correct UUID v4 Format
```
550e8400-e29b-41d4-a716-446655440000
│      │ │  │ │  │ │              │
└──────┘ └──┘ └──┘ └──────────────┘
8 chars  4    4    12 chars
Total: 36 characters (32 hex + 4 hyphens)
```

### Common Mistakes
❌ Missing hyphens: `550e8400e29b41d4a716446655440000` (32 chars)  
❌ Too short: `550e8400-e29b-41d4-a716` (20 chars)  
❌ Wrong position: `550e8400-e29b-41d4-a716-4466` (28 chars)  
✅ Correct: `550e8400-e29b-41d4-a716-446655440000` (36 chars)

### Validate IDs in Code
```typescript
const validateID = (id: string, name: string = 'ID') => {
  if (!id) {
    throw new Error(`${name} is required`);
  }
  if (id.length !== 36) {
    throw new Error(`${name} must be 36 characters (got ${id.length})`);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error(`${name} has invalid UUID format`);
  }
  return true;
};

// Usage
validateID(videoId, 'Video ID');
validateID(channelId, 'Channel ID');
```

---

## Authentication Debug Checklist

Use this checklist to debug auth issues:

- [ ] Token exists in storage
- [ ] Token is 96 characters long
- [ ] Token contains only hex characters (0-9, a-f)
- [ ] Authorization header format: `Bearer {token}` (note the space)
- [ ] Session exists in database
- [ ] Session not expired (check `expires_at`)
- [ ] User ID in session matches user in database
- [ ] Request includes correct `Accept: application/json` header

### Check Session in Database
```sql
-- Check if session exists and is valid
SELECT 
    s.token,
    s.user_id,
    s.expires_at,
    s.created_at,
    (s.expires_at > NOW()) as is_valid,
    u.username,
    u.email
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.token = 'YOUR_TOKEN_HERE';
```

### Debug Auth Flow
```typescript
// Add to AuthContext or debugging code
const debugAuth = async () => {
  console.log('=== Auth Debug Info ===');
  console.log('Auth Token:', authToken?.substring(0, 10) + '...');
  console.log('Token Length:', authToken?.length);
  console.log('Is Authenticated:', isAuthenticated);
  console.log('User ID:', authUser?.id);
  console.log('User Role:', authUser?.role);
  console.log('API Root:', getEnvApiRootUrl());
  
  // Test token validity
  if (authToken) {
    try {
      const response = await fetch(`${getEnvApiRootUrl()}/auth/me.php`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Token Valid:', response.ok);
      if (!response.ok) {
        console.log('Response Status:', response.status);
        console.log('Response Text:', await response.text());
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }
  }
};

// Call when debugging
debugAuth();
```

---

## API Response Debugging

### Expected vs Actual

#### Video Details Success Response
```typescript
{
  success: true,
  video: {
    id: string,              // UUID v4
    user_id: string,         // UUID v4
    channel_id: string,      // UUID v4
    title: string,
    description: string,
    video_url: string,       // Full URL
    thumbnail: string,       // Full URL
    views: number,
    likes: number,
    dislikes: number,
    uploader: {
      id: string,            // UUID v4
      username: string,
      name: string | null,
      profile_pic: string | null,
      channel_id: string     // UUID v4
    },
    // Only if authenticated:
    is_liked?: boolean,
    is_disliked?: boolean,
    is_saved?: boolean
  },
  comments: Comment[]
}
```

#### Error Response Format
```typescript
{
  success: false,
  error: string,             // Human-readable error
  message?: string           // Optional additional context
}
```

### Logging Response Data
```typescript
const fetchVideoDetails = async (videoId: string) => {
  try {
    const response = await fetch(url);
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw Response (first 200 chars):', text.substring(0, 200));
    
    const data = JSON.parse(text);
    console.log('Parsed Success:', data.success);
    console.log('Has Video:', !!data.video);
    console.log('Has Error:', !!data.error);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
```

---

## Network Issues

### Mobile Network Debugging

#### iOS
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // Add to Info.plist for HTTP debugging
  // NSAppTransportSecurity -> NSAllowsArbitraryLoads: true
}
```

#### Android
```typescript
// Add to android/app/src/main/AndroidManifest.xml
// android:usesCleartextTraffic="true"
```

### Network State Check
```typescript
import NetInfo from '@react-native-community/netinfo';

const checkNetwork = async () => {
  const state = await NetInfo.fetch();
  console.log('Connected:', state.isConnected);
  console.log('Type:', state.type);
  console.log('Details:', state.details);
  return state.isConnected;
};

// Use before making requests
if (!(await checkNetwork())) {
  Alert.alert('No Internet', 'Please check your connection');
  return;
}
```

---

## Server-Side Debugging

### Enable PHP Error Logging
```php
// Add to top of API files temporarily
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
```

### Check Error Logs
```bash
# View PHP error log (location varies by server)
tail -f /var/log/php_errors.log

# Or Apache error log
tail -f /var/log/apache2/error.log

# Check if API file exists
ls -la /path/to/api/video/details.php

# Check file permissions
chmod 644 /path/to/api/video/details.php
chmod 755 /path/to/api/video/
```

### Test Database Connection
```php
// Create test-db.php
<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'u449340066_rumplay');
define('DB_PASS', '6>E/UCiT;AYh');
define('DB_NAME', 'u449340066_rumplay');

try {
    $db = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS
    );
    echo json_encode(['success' => true, 'message' => 'Database connected']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
```

### Test Specific Video
```bash
# Replace with actual video ID from database
curl "https://moviedbr.com/api/video/details.php?video_id=550e8400-e29b-41d4-a716-446655440000"
```

---

## Quick Recovery Steps

If nothing else works, try these in order:

1. **Clear app data and restart**
   ```typescript
   // Clear all auth data
   await AsyncStorage.clear();
   // Or selectively:
   await AsyncStorage.removeItem('rork_auth_token');
   await AsyncStorage.removeItem('rork_auth_user');
   ```

2. **Re-login**
   - Log out completely
   - Close and restart the app
   - Log back in

3. **Check server status**
   - Visit `https://moviedbr.com/api/health.php` in browser
   - Should return `{"success":true,"message":"API is working"}`

4. **Verify video exists in database**
   ```sql
   SELECT id, title, user_id, channel_id 
   FROM videos 
   WHERE id = 'YOUR_VIDEO_ID';
   ```

5. **Test with different video**
   - Try a different video ID
   - Rules out video-specific issues

6. **Contact backend admin**
   - Provide: timestamp, user ID, video ID, full error message
   - Check if server is under maintenance

---

## Support

For persistent issues:

1. **Check documentation**: 
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
   - [API_ID_FORMAT.md](./API_ID_FORMAT.md)

2. **Enable debug mode** in app and collect logs

3. **Provide debug info**:
   - App platform (iOS/Android/Web)
   - API endpoint failing
   - Full error message
   - Request headers (redact token)
   - Response body
   - Network conditions

4. **Check server logs** for corresponding errors

---

## Recent Fixes

### 2025-01-18: Video Details Unauthorized Error
- **Fixed**: `api/video/details.php` now handles auth errors gracefully
- **Fixed**: `api/db.php` `getAuthUser()` returns null on errors instead of throwing
- **Added**: Comprehensive error logging for debugging
- **Impact**: Video details now work with or without authentication

---

**Last Updated**: January 18, 2025
