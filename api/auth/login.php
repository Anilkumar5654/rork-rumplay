<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    respond(['success' => false, 'error' => 'Email and password required'], 400);
}

$db = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !verifyPassword($password, $user['password_hash'], $user['password_salt'])) {
    respond(['success' => false, 'error' => 'Invalid credentials'], 401);
}

$token = generateToken();
$expiresAt = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60));

$stmt = $db->prepare("
    INSERT INTO sessions (token, user_id, expires_at, created_at) 
    VALUES (:token, :user_id, :expires_at, NOW())
");
$stmt->execute([
    'token' => $token,
    'user_id' => $user['id'],
    'expires_at' => $expiresAt
]);

if (empty($user['channel_id'])) {
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

    $stmt = $db->prepare("UPDATE users SET channel_id = :channel_id WHERE id = :id");
    $stmt->execute([
        'channel_id' => $channelId,
        'id' => $user['id']
    ]);

    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    $user = $stmt->fetch();
}

respond([
    'success' => true,
    'token' => $token,
    'user' => formatUserResponse($user)
]);
