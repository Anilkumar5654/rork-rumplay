<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true);

$videoId = $input['video_id'] ?? '';
$action = $input['action'] ?? 'like';

if (empty($videoId)) {
    respond(['success' => false, 'error' => 'Video ID required'], 400);
}

$videoId = requireValidId($videoId, 'Video ID');

if (!in_array($action, ['like', 'unlike'])) {
    respond(['success' => false, 'error' => 'Invalid action'], 400);
}

$db = getDB();

$stmt = $db->prepare("SELECT id FROM videos WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);
if (!$stmt->fetch()) {
    respond(['success' => false, 'error' => 'Video not found'], 404);
}

if ($action === 'like') {
    $stmt = $db->prepare("
        INSERT IGNORE INTO video_likes (id, video_id, user_id, created_at)
        VALUES (:id, :video_id, :user_id, NOW())
    ");
    $stmt->execute([
        'id' => generateUUID(),
        'video_id' => $videoId,
        'user_id' => $user['id']
    ]);
    
    if ($stmt->rowCount() > 0) {
        $stmt = $db->prepare("UPDATE videos SET likes = likes + 1 WHERE id = :video_id");
        $stmt->execute(['video_id' => $videoId]);
    }
    
    $message = 'Video liked';
} else {
    $stmt = $db->prepare("DELETE FROM video_likes WHERE video_id = :video_id AND user_id = :user_id");
    $stmt->execute([
        'video_id' => $videoId,
        'user_id' => $user['id']
    ]);
    
    if ($stmt->rowCount() > 0) {
        $stmt = $db->prepare("UPDATE videos SET likes = GREATEST(likes - 1, 0) WHERE id = :video_id");
        $stmt->execute(['video_id' => $videoId]);
    }
    
    $message = 'Video unliked';
}

$stmt = $db->prepare("SELECT likes FROM videos WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);
$likes = $stmt->fetch()['likes'];

respond([
    'success' => true,
    'message' => $message,
    'likes' => (int)$likes
]);
