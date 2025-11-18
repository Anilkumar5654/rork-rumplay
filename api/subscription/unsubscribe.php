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

$db = getDB();

$stmt = $db->prepare("SELECT id FROM channels WHERE id = :channel_id");
$stmt->execute(['channel_id' => $channelId]);

if (!$stmt->fetch()) {
    respond(['success' => false, 'error' => 'Channel not found'], 404);
}

$stmt = $db->prepare("
    DELETE FROM subscriptions 
    WHERE user_id = :user_id AND creator_id = :channel_id
");
$stmt->execute([
    'user_id' => $user['id'],
    'channel_id' => $channelId
]);

if ($stmt->rowCount() === 0) {
    respond(['success' => false, 'error' => 'Not subscribed to this channel'], 400);
}

$stmt = $db->prepare("
    UPDATE channels 
    SET subscriber_count = GREATEST(subscriber_count - 1, 0)
    WHERE id = :channel_id
");
$stmt->execute(['channel_id' => $channelId]);

$stmt = $db->prepare("SELECT subscriber_count FROM channels WHERE id = :channel_id");
$stmt->execute(['channel_id' => $channelId]);
$subscriberCount = (int)$stmt->fetch()['subscriber_count'];

respond([
    'success' => true,
    'message' => 'Unsubscribed successfully',
    'subscriber_count' => $subscriberCount
]);
