<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$userId = $_GET['user_id'] ?? '';

error_log("Get user details for user_id: $userId");

if (empty($userId)) {
    respond(['success' => false, 'error' => 'User ID required'], 400);
}

$db = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    error_log("User not found: $userId");
    respond(['success' => false, 'error' => 'User not found'], 404);
}

error_log("User found: " . json_encode($user));

$formattedUser = formatUserResponse($user);
error_log("Formatted user: " . json_encode($formattedUser));

respond(['success' => true, 'user' => $formattedUser]);
