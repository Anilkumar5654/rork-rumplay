<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireRole(['admin', 'superadmin']);

$db = getDB();

$limit = (int)($_GET['limit'] ?? 50);
$offset = (int)($_GET['offset'] ?? 0);

$stmt = $db->prepare("
    SELECT id, username, name, email, role, profile_pic, phone, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT :limit OFFSET :offset
");

$stmt->bindValue('limit', $limit, PDO::PARAM_INT);
$stmt->bindValue('offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$users = $stmt->fetchAll();

respond([
    'success' => true,
    'users' => $users
]);
