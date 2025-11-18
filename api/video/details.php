<?php
error_log('[video/details.php] Request received: ' . json_encode($_GET));
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$videoId = $_GET['video_id'] ?? '';

if (empty($videoId)) {
    respond(['success' => false, 'error' => 'Video ID required'], 400);
}

try {
    $db = getDB();
} catch (Exception $e) {
    error_log('[video/details.php] Database error: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'Database connection failed'], 500);
}

$stmt = $db->prepare("
    SELECT 
        v.*,
        u.id as uploader_id,
        u.username as uploader_username,
        u.name as uploader_name,
        u.profile_pic as uploader_profile_pic
    FROM videos v
    INNER JOIN users u ON v.user_id = u.id
    WHERE v.id = :video_id
");
$stmt->execute(['video_id' => $videoId]);
$video = $stmt->fetch();

if (!$video) {
    respond(['success' => false, 'error' => 'Video not found'], 404);
}

$video['tags'] = json_decode($video['tags'] ?? '[]', true);
$video['uploader'] = [
    'id' => $video['uploader_id'],
    'username' => $video['uploader_username'],
    'name' => $video['uploader_name'],
    'profile_pic' => $video['uploader_profile_pic']
];
unset($video['uploader_id'], $video['uploader_username'], $video['uploader_name'], $video['uploader_profile_pic']);

$stmt = $db->prepare("
    SELECT 
        c.*,
        u.username,
        u.name,
        u.profile_pic
    FROM video_comments c
    INNER JOIN users u ON c.user_id = u.id
    WHERE c.video_id = :video_id
    ORDER BY c.created_at DESC
    LIMIT 50
");
$stmt->execute(['video_id' => $videoId]);
$comments = $stmt->fetchAll();

foreach ($comments as &$comment) {
    $comment['user'] = [
        'username' => $comment['username'],
        'name' => $comment['name'],
        'profile_pic' => $comment['profile_pic']
    ];
    unset($comment['username'], $comment['name'], $comment['profile_pic']);
}

try {
    $user = getAuthUser();
    error_log('[video/details.php] Auth user: ' . ($user ? $user['id'] : 'not authenticated'));
} catch (Exception $e) {
    error_log('[video/details.php] Auth error (non-fatal): ' . $e->getMessage());
    $user = null;
}
$video['is_liked'] = false;
$video['is_disliked'] = false;
$video['is_saved'] = false;

if ($user) {
    $stmt = $db->prepare("
        SELECT COUNT(*) as is_liked
        FROM video_likes
        WHERE video_id = :video_id AND user_id = :user_id
    ");
    $stmt->execute([
        'video_id' => $videoId,
        'user_id' => $user['id']
    ]);
    $video['is_liked'] = (int)$stmt->fetch()['is_liked'] > 0;
}

$video['comments_count'] = count($comments);

respond([
    'success' => true,
    'video' => $video,
    'comments' => $comments
]);
