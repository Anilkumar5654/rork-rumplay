<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$videoId = $_GET['video_id'] ?? '';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
$offset = ($page - 1) * $limit;

if (empty($videoId)) {
    respond(['success' => false, 'error' => 'Video ID required'], 400);
}

$db = getDB();

$stmt = $db->prepare("SELECT id FROM videos WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);
if (!$stmt->fetch()) {
    respond(['success' => false, 'error' => 'Video not found'], 404);
}

$stmt = $db->prepare("
    SELECT COUNT(*) as total
    FROM video_comments
    WHERE video_id = :video_id
");
$stmt->execute(['video_id' => $videoId]);
$totalComments = (int)$stmt->fetch()['total'];

$stmt = $db->prepare("
    SELECT 
        c.id,
        c.video_id,
        c.user_id,
        c.comment,
        c.created_at,
        u.username,
        u.name,
        u.profile_pic
    FROM video_comments c
    INNER JOIN users u ON c.user_id = u.id
    WHERE c.video_id = :video_id
    ORDER BY c.created_at DESC
    LIMIT :limit OFFSET :offset
");
$stmt->bindValue('video_id', $videoId, PDO::PARAM_STR);
$stmt->bindValue('limit', $limit, PDO::PARAM_INT);
$stmt->bindValue('offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$comments = $stmt->fetchAll();

foreach ($comments as &$comment) {
    $comment['user'] = [
        'username' => $comment['username'],
        'name' => $comment['name'],
        'profile_pic' => $comment['profile_pic']
    ];
    unset($comment['username'], $comment['name'], $comment['profile_pic']);
}

$totalPages = (int)ceil($totalComments / $limit);

respond([
    'success' => true,
    'comments' => $comments,
    'pagination' => [
        'current_page' => $page,
        'total_pages' => $totalPages,
        'total_comments' => $totalComments,
        'limit' => $limit
    ]
]);
