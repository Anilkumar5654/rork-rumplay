<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true);

$videoId = $input['video_id'] ?? '';
$comment = trim($input['comment'] ?? '');

if (empty($videoId) || empty($comment)) {
    respond(['success' => false, 'error' => 'Video ID and comment required'], 400);
}

$videoId = requireValidId($videoId, 'Video ID');

$db = getDB();

$stmt = $db->prepare("SELECT id FROM videos WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);
if (!$stmt->fetch()) {
    respond(['success' => false, 'error' => 'Video not found'], 404);
}

$commentId = generateUUID();
$stmt = $db->prepare("
    INSERT INTO video_comments (id, video_id, user_id, comment, created_at)
    VALUES (:id, :video_id, :user_id, :comment, NOW())
");

$stmt->execute([
    'id' => $commentId,
    'video_id' => $videoId,
    'user_id' => $user['id'],
    'comment' => $comment
]);

respond([
    'success' => true,
    'comment_id' => $commentId,
    'message' => 'Comment added'
]);
