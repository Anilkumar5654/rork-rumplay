<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true);

$channelId = $input['channel_id'] ?? '';

if (empty($channelId)) {
    respond(['success' => false, 'error' => 'Channel ID required'], 400);
}

$channelId = requireValidId($channelId, 'Channel ID');

$db = getDB();

$stmt = $db->prepare("SELECT id, user_id FROM channels WHERE id = :channel_id");
$stmt->execute(['channel_id' => $channelId]);
$channel = $stmt->fetch();

if (!$channel) {
    respond(['success' => false, 'error' => 'Channel not found'], 404);
}

if ($channel['user_id'] === $user['id']) {
    respond(['success' => false, 'error' => 'You cannot subscribe to your own channel'], 400);
}

$stmt = $db->prepare("
    SELECT id FROM subscriptions 
    WHERE user_id = :user_id AND creator_id = :channel_id
");
$stmt->execute([
    'user_id' => $user['id'],
    'channel_id' => $channelId
]);

if ($stmt->fetch()) {
    respond(['success' => false, 'error' => 'Already subscribed'], 400);
}

$subscriptionId = generateUUID();
$stmt = $db->prepare("
    INSERT INTO subscriptions (id, user_id, creator_id, notifications, created_at)
    VALUES (:id, :user_id, :creator_id, 1, NOW())
");
$stmt->execute([
    'id' => $subscriptionId,
    'user_id' => $user['id'],
    'creator_id' => $channelId
]);

$stmt = $db->prepare("
    UPDATE channels 
    SET subscriber_count = subscriber_count + 1 
    WHERE id = :channel_id
");
$stmt->execute(['channel_id' => $channelId]);

$stmt = $db->prepare("SELECT subscriber_count FROM channels WHERE id = :channel_id");
$stmt->execute(['channel_id' => $channelId]);
$subscriberCount = (int)$stmt->fetch()['subscriber_count'];

respond([
    'success' => true,
    'message' => 'Subscribed successfully',
    'subscriber_count' => $subscriberCount
]);
