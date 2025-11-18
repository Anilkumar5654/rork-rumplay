<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$channelId = $_GET['channel_id'] ?? '';

if (empty($channelId)) {
    respond(['success' => false, 'error' => 'Channel ID required'], 400);
}

$db = getDB();

$stmt = $db->prepare("
    SELECT 
        id,
        user_id,
        name,
        handle,
        avatar,
        banner,
        description,
        subscriber_count,
        total_views,
        total_watch_hours,
        verified,
        monetization,
        created_at,
        updated_at,
        handle_last_changed
    FROM channels
    WHERE id = :channel_id
");
$stmt->execute(['channel_id' => $channelId]);
$channel = $stmt->fetch();

if (!$channel) {
    respond(['success' => false, 'error' => 'Channel not found'], 404);
}

$stmt = $db->prepare("
    SELECT COUNT(*) as video_count
    FROM videos
    WHERE channel_id = :channel_id AND privacy = 'public'
");
$stmt->execute(['channel_id' => $channelId]);
$channel['video_count'] = (int)$stmt->fetch()['video_count'];

$channel['subscriber_count'] = (int)$channel['subscriber_count'];
$channel['total_views'] = (int)($channel['total_views'] ?? 0);
$channel['total_watch_hours'] = (int)($channel['total_watch_hours'] ?? 0);
$channel['verified'] = (int)($channel['verified'] ?? 0);

$user = getAuthUser();
$channel['is_subscribed'] = false;

if ($user) {
    $stmt = $db->prepare("
        SELECT COUNT(*) as is_subscribed
        FROM subscriptions
        WHERE user_id = :user_id AND creator_id = :channel_id
    ");
    $stmt->execute([
        'user_id' => $user['id'],
        'channel_id' => $channelId
    ]);
    $channel['is_subscribed'] = (int)$stmt->fetch()['is_subscribed'] > 0;
}

respond([
    'success' => true,
    'channel' => $channel
]);
