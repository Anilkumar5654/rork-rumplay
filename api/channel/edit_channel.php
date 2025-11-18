<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

$db = getDB();
$channelStmt = $db->prepare("SELECT * FROM channels WHERE user_id = :user_id LIMIT 1");
$channelStmt->execute(['user_id' => $user['id']]);
$channel = $channelStmt->fetch(PDO::FETCH_ASSOC);

if (!$channel) {
    respond(['success' => false, 'error' => 'Channel not found. You do not own a channel.'], 404);
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'multipart/form-data') !== false) {
    $name = $_POST['name'] ?? null;
    $handle = $_POST['handle'] ?? null;
    $description = $_POST['description'] ?? null;
    
    $avatarFile = $_FILES['avatar'] ?? null;
    $bannerFile = $_FILES['banner'] ?? null;
} else {
    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody, true);
    
    if (!$input) {
        respond(['success' => false, 'error' => 'Invalid JSON payload'], 400);
    }
    
    $name = $input['name'] ?? null;
    $handle = $input['handle'] ?? null;
    $description = $input['description'] ?? null;
    $avatarFile = null;
    $bannerFile = null;
}

$updates = [];
$params = ['id' => $channel['id']];

if ($name !== null && strlen(trim($name)) > 0) {
    $updates[] = "name = :name";
    $params['name'] = trim($name);
}

if ($handle !== null && strlen(trim($handle)) > 0) {
    $handleValue = trim($handle);
    if (!str_starts_with($handleValue, '@')) {
        $handleValue = '@' . $handleValue;
    }
    
    $existingHandleStmt = $db->prepare("SELECT id FROM channels WHERE handle = :handle AND id != :id LIMIT 1");
    $existingHandleStmt->execute(['handle' => $handleValue, 'id' => $channel['id']]);
    $existingHandle = $existingHandleStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingHandle) {
        respond(['success' => false, 'error' => 'Handle is already taken'], 400);
    }
    
    if ($channel['handle'] !== $handleValue) {
        $lastHandleChange = $channel['handle_last_changed'] ?? null;
        
        if ($lastHandleChange) {
            $lastChangeTime = strtotime($lastHandleChange);
            $currentTime = time();
            $daysSinceLastChange = ($currentTime - $lastChangeTime) / (60 * 60 * 24);
            
            if ($daysSinceLastChange < 20) {
                $daysRemaining = ceil(20 - $daysSinceLastChange);
                respond([
                    'success' => false,
                    'error' => "Handle can be changed only once every 20 days. Please wait $daysRemaining more days."
                ], 400);
            }
        }
        
        $updates[] = "handle = :handle";
        $updates[] = "handle_last_changed = NOW()";
        $params['handle'] = $handleValue;
    }
}

if ($description !== null) {
    $updates[] = "description = :description";
    $params['description'] = trim($description);
}

$uploadsDir = __DIR__ . '/../uploads/channels';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

if ($avatarFile && $avatarFile['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    $fileType = mime_content_type($avatarFile['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        respond(['success' => false, 'error' => 'Invalid avatar file type. Only JPEG, PNG, and WEBP are allowed.'], 400);
    }
    
    $maxSize = 5 * 1024 * 1024;
    if ($avatarFile['size'] > $maxSize) {
        respond(['success' => false, 'error' => 'Avatar file size exceeds 5MB limit.'], 400);
    }
    
    $extension = pathinfo($avatarFile['name'], PATHINFO_EXTENSION);
    $fileName = 'avatar_' . $channel['id'] . '_' . time() . '.' . $extension;
    $filePath = $uploadsDir . '/' . $fileName;
    
    if (move_uploaded_file($avatarFile['tmp_name'], $filePath)) {
        $updates[] = "avatar = :avatar";
        $params['avatar'] = '/uploads/channels/' . $fileName;
        
        if ($channel['avatar'] && strpos($channel['avatar'], '/uploads/') === 0) {
            $oldAvatarPath = __DIR__ . '/..' . $channel['avatar'];
            if (file_exists($oldAvatarPath)) {
                unlink($oldAvatarPath);
            }
        }
    } else {
        respond(['success' => false, 'error' => 'Failed to upload avatar file.'], 500);
    }
}

if ($bannerFile && $bannerFile['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    $fileType = mime_content_type($bannerFile['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        respond(['success' => false, 'error' => 'Invalid banner file type. Only JPEG, PNG, and WEBP are allowed.'], 400);
    }
    
    $maxSize = 10 * 1024 * 1024;
    if ($bannerFile['size'] > $maxSize) {
        respond(['success' => false, 'error' => 'Banner file size exceeds 10MB limit.'], 400);
    }
    
    $extension = pathinfo($bannerFile['name'], PATHINFO_EXTENSION);
    $fileName = 'banner_' . $channel['id'] . '_' . time() . '.' . $extension;
    $filePath = $uploadsDir . '/' . $fileName;
    
    if (move_uploaded_file($bannerFile['tmp_name'], $filePath)) {
        $updates[] = "banner = :banner";
        $params['banner'] = '/uploads/channels/' . $fileName;
        
        if ($channel['banner'] && strpos($channel['banner'], '/uploads/') === 0) {
            $oldBannerPath = __DIR__ . '/..' . $channel['banner'];
            if (file_exists($oldBannerPath)) {
                unlink($oldBannerPath);
            }
        }
    } else {
        respond(['success' => false, 'error' => 'Failed to upload banner file.'], 500);
    }
}

if (empty($updates)) {
    respond(['success' => false, 'error' => 'No valid fields to update'], 400);
}

$sql = "UPDATE channels SET " . implode(', ', $updates) . " WHERE id = :id";
$updateStmt = $db->prepare($sql);
$updateStmt->execute($params);

$updatedChannelStmt = $db->prepare("SELECT * FROM channels WHERE id = :id LIMIT 1");
$updatedChannelStmt->execute(['id' => $channel['id']]);
$updatedChannel = $updatedChannelStmt->fetch(PDO::FETCH_ASSOC);

$apiBaseUrl = getApiBaseUrl();

$avatarUrl = $updatedChannel['avatar'];
if ($avatarUrl && strpos($avatarUrl, '/uploads/') === 0) {
    $avatarUrl = $apiBaseUrl . $avatarUrl;
}

$bannerUrl = $updatedChannel['banner'];
if ($bannerUrl && strpos($bannerUrl, '/uploads/') === 0) {
    $bannerUrl = $apiBaseUrl . $bannerUrl;
}

respond([
    'success' => true,
    'channel' => [
        'id' => $updatedChannel['id'],
        'userId' => $updatedChannel['user_id'],
        'name' => $updatedChannel['name'],
        'handle' => $updatedChannel['handle'],
        'description' => $updatedChannel['description'],
        'avatar' => $avatarUrl,
        'banner' => $bannerUrl,
        'handleLastChanged' => $updatedChannel['handle_last_changed']
    ],
    'message' => 'Channel updated successfully'
]);
