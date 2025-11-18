<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM sessions WHERE token = :token");
    $stmt->execute(['token' => $token]);
}

respond(['success' => true]);
