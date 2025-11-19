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

error_log('[video/details.php] Looking for video: ' . $videoId);

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
        u.profile_pic as uploader_profile_pic,
        u.channel_id as uploader_channel_id
    FROM videos v
    INNER JOIN users u ON v.user_id = u.id
    WHERE v.id = :video_id
");
$stmt->execute(['video_id' => $videoId]);
$video = $stmt->fetch();

if (!$video) {
    error_log('[video/details.php] Video not found: ' . $videoId);
    respond(['success' => false, 'error' => 'Video not found'], 404);
}

error_log('[video/details.php] Video found: ' . $video['title']);
error_log('[video/details.php] Video IDs - video_id: ' . $video['id'] . ', user_id: ' . $video['user_id'] . ', channel_id: ' . $video['channel_id']);

$video['tags'] = json_decode($video['tags'] ?? '[]', true);
$video['uploader'] = [
    'id' => $video['uploader_id'],
    'username' => $video['uploader_username'],
    'name' => $video['uploader_name'],
    'profile_pic' => $video['uploader_profile_pic'],
    'channel_id' => $video['uploader_channel_id']
];
unset($video['uploader_id'], $video['uploader_username'], $video['uploader_name'], $video['uploader_profile_pic'], $video['uploader_channel_id']);

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

$user = getAuthUser();
error_log('[video/details.php] Auth user: ' . ($user ? $user['id'] : 'not authenticated'));

$video['is_liked'] = false;
$video['is_disliked'] = false;
$video['is_saved'] = false;

if ($user) {
    error_log('[video/details.php] Checking like status for user: ' . $user['id']);
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
    error_log('[video/details.php] Is liked: ' . ($video['is_liked'] ? 'yes' : 'no'));
}

$video['comments_count'] = count($comments);

respond([
    'success' => true,
    'video' => $video,
    'comments' => $comments
]);
