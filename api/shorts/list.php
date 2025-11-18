<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$db = getDB();

$limit = $_GET['limit'] ?? 20;
$offset = $_GET['offset'] ?? 0;

$stmt = $db->prepare("
    SELECT 
        s.*,
        u.id as uploader_id,
        u.username as uploader_username,
        u.name as uploader_name,
        u.profile_pic as uploader_profile_pic
    FROM shorts s
    INNER JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT :limit OFFSET :offset
");

$stmt->bindValue('limit', (int)$limit, PDO::PARAM_INT);
$stmt->bindValue('offset', (int)$offset, PDO::PARAM_INT);
$stmt->execute();

$shorts = $stmt->fetchAll();

foreach ($shorts as &$short) {
    $short['uploader'] = [
        'id' => $short['uploader_id'],
        'username' => $short['uploader_username'],
        'name' => $short['uploader_name'],
        'profile_pic' => $short['uploader_profile_pic']
    ];
    unset($short['uploader_id'], $short['uploader_username'], $short['uploader_name'], $short['uploader_profile_pic']);
}

respond([
    'success' => true,
    'shorts' => $shorts
]);
