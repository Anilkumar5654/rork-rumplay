<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

$db = getDB();
$stmt = $db->prepare("
    SELECT * FROM videos 
    WHERE user_id = :user_id 
    ORDER BY created_at DESC
");
$stmt->execute(['user_id' => $user['id']]);
$videos = $stmt->fetchAll();

foreach ($videos as &$video) {
    $video['tags'] = json_decode($video['tags'] ?? '[]', true);
}

respond(['success' => true, 'videos' => $videos]);
