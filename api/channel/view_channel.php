<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$channelId = $_GET['id'] ?? null;
$authUser = getAuthUser();
$db = getDB();

if (!empty($channelId)) {
    $channelId = requireValidId($channelId, 'Channel ID');
}

if (!$channelId) {
    if (!$authUser) {
        respond(['success' => false, 'error' => 'Channel ID is required or user must be authenticated'], 400);
    }
    
    $stmt = $db->prepare("SELECT * FROM channels WHERE user_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $authUser['id']]);
    $channel = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$channel) {
        respond(['success' => false, 'error' => 'You do not have a channel yet'], 404);
    }
} else {
    $stmt = $db->prepare("SELECT * FROM channels WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $channelId]);
    $channel = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$channel) {
        respond(['success' => false, 'error' => 'Channel not found'], 404);
    }
}

$userStmt = $db->prepare("SELECT id FROM users WHERE id = :user_id LIMIT 1");
$userStmt->execute(['user_id' => $channel['user_id']]);
$owner = $userStmt->fetch(PDO::FETCH_ASSOC);

$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$apiBaseUrl = $protocol . '://' . $host;

$avatarUrl = $channel['avatar'];
if ($avatarUrl && strpos($avatarUrl, '/uploads/') === 0) {
    $avatarUrl = $apiBaseUrl . $avatarUrl;
}

$bannerUrl = $channel['banner'];
if ($bannerUrl && strpos($bannerUrl, '/uploads/') === 0) {
    $bannerUrl = $apiBaseUrl . $bannerUrl;
}

$isOwner = false;
if ($authUser && $authUser['id'] === $channel['user_id']) {
    $isOwner = true;
}

respond([
    'success' => true,
    'channel' => [
        'id' => $channel['id'],
        'userId' => $channel['user_id'],
        'name' => $channel['name'],
        'handle' => $channel['handle'],
        'description' => $channel['description'] ?? '',
        'avatar' => $avatarUrl,
        'banner' => $bannerUrl,
        'subscriberCount' => 0,
        'totalViews' => 0,
        'totalWatchHours' => 0,
        'verified' => false,
        'monetization' => false,
        'handleLastChanged' => $channel['handle_last_changed'] ?? null,
        'createdAt' => $channel['created_at'],
        'updatedAt' => $channel['updated_at'] ?? $channel['created_at'],
        'isOwner' => $isOwner
    ]
]);
