<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

$db = getDB();
$existingChannel = $db->prepare("SELECT id, name, handle FROM channels WHERE user_id = :user_id LIMIT 1");
$existingChannel->execute(['user_id' => $user['id']]);
$channel = $existingChannel->fetch(PDO::FETCH_ASSOC);

if ($channel) {
    respond([
        'success' => true,
        'channel' => $channel,
        'message' => 'Channel already exists'
    ]);
}

$channelId = generateUUID();
$channelName = $user['username'] . "'s Channel";
$handle = '@' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $user['username'])) . '_' . substr($channelId, 0, 6);
$description = 'Welcome to my channel!';

$stmt = $db->prepare("
    INSERT INTO channels (
        id, user_id, name, handle, description, monetization, created_at
    ) VALUES (
        :id, :user_id, :name, :handle, :description, :monetization, NOW()
    )
");

$stmt->execute([
    'id' => $channelId,
    'user_id' => $user['id'],
    'name' => $channelName,
    'handle' => $handle,
    'description' => $description,
    'monetization' => json_encode([])
]);

$updateUser = $db->prepare("UPDATE users SET channel_id = :channel_id WHERE id = :id");
$updateUser->execute([
    'channel_id' => $channelId,
    'id' => $user['id']
]);

respond([
    'success' => true,
    'channel' => [
        'id' => $channelId,
        'name' => $channelName,
        'handle' => $handle,
        'description' => $description
    ],
    'message' => 'Channel created successfully'
]);
