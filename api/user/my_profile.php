<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

$db = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user['id']]);
$userDetails = $stmt->fetch();

if (!$userDetails) {
    respond(['success' => false, 'error' => 'User not found'], 404);
}

error_log("Fetching profile for user: " . $user['id']);
error_log("User details: " . json_encode($userDetails));

respond([
    'success' => true,
    'user' => formatUserResponse($userDetails)
]);
