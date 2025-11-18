<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';
$username = trim($input['username'] ?? '');
$displayName = trim($input['displayName'] ?? $username);

if (empty($email) || empty($password) || empty($username)) {
    respond(['success' => false, 'error' => 'Email, password, and username are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['success' => false, 'error' => 'Invalid email format'], 400);
}

if (strlen($password) < 6) {
    respond(['success' => false, 'error' => 'Password must be at least 6 characters'], 400);
}

if (strlen($username) < 3 || strlen($username) > 64) {
    respond(['success' => false, 'error' => 'Username must be between 3 and 64 characters'], 400);
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    respond(['success' => false, 'error' => 'Username can only contain letters, numbers, and underscores'], 400);
}

$db = getDB();

$stmt = $db->prepare("SELECT id FROM users WHERE email = :email OR username = :username");
$stmt->execute(['email' => $email, 'username' => $username]);
if ($stmt->fetch()) {
    respond(['success' => false, 'error' => 'Email or username already exists'], 400);
}

$passwordData = hashPassword($password);
$userId = generateUUID();

$stmt = $db->prepare("
    INSERT INTO users (id, username, name, email, password_hash, password_salt, role, created_at) 
    VALUES (:id, :username, :name, :email, :hash, :salt, 'user', NOW())
");

$stmt->execute([
    'id' => $userId,
    'username' => $username,
    'name' => $displayName,
    'email' => $email,
    'hash' => $passwordData['hash'],
    'salt' => $passwordData['salt']
]);

$token = generateToken();
$expiresAt = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60));

$stmt = $db->prepare("
    INSERT INTO sessions (token, user_id, expires_at, created_at) 
    VALUES (:token, :user_id, :expires_at, NOW())
");
$stmt->execute([
    'token' => $token,
    'user_id' => $userId,
    'expires_at' => $expiresAt
]);

$channelId = generateUUID();
$channelName = $username . "'s Channel";
$handle = '@' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $username)) . '_' . substr($channelId, 0, 6);
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
    'user_id' => $userId,
    'name' => $channelName,
    'handle' => $handle,
    'description' => $description,
    'monetization' => json_encode([])
]);

$stmt = $db->prepare("UPDATE users SET channel_id = :channel_id WHERE id = :id");
$stmt->execute([
    'channel_id' => $channelId,
    'id' => $userId
]);

$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $userId]);
$user = $stmt->fetch();

respond([
    'success' => true,
    'token' => $token,
    'user' => formatUserResponse($user)
]);
