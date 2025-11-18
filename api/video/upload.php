<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

if (!isset($_FILES['video']) || !isset($_POST['title'])) {
    respond(['success' => false, 'error' => 'Video file and title are required'], 400);
}

$title = trim($_POST['title']);
$description = trim($_POST['description'] ?? '');
$category = trim($_POST['category'] ?? 'Other');
$tags = $_POST['tags'] ?? '';
$privacy = $_POST['privacy'] ?? 'public';
$isShort = (int)($_POST['is_short'] ?? 0);

if (empty($title)) {
    respond(['success' => false, 'error' => 'Title is required'], 400);
}

if (!in_array($privacy, ['public', 'private', 'unlisted', 'scheduled'])) {
    $privacy = 'public';
}

$uploadDir = '../uploads/';
if (!file_exists($uploadDir . 'videos')) {
    mkdir($uploadDir . 'videos', 0755, true);
}
if (!file_exists($uploadDir . 'thumbnails')) {
    mkdir($uploadDir . 'thumbnails', true);
}

$videoFile = $_FILES['video'];
$allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
$maxVideoSize = 500 * 1024 * 1024;

if (!in_array($videoFile['type'], $allowedVideoTypes)) {
    respond(['success' => false, 'error' => 'Invalid video format. Only MP4, MOV, AVI allowed'], 400);
}

if ($videoFile['size'] > $maxVideoSize) {
    respond(['success' => false, 'error' => 'Video file too large. Max 500MB'], 400);
}

$videoExt = pathinfo($videoFile['name'], PATHINFO_EXTENSION);
$videoUuid = generateUUID();
$videoFilename = $videoUuid . '.' . $videoExt;
$videoPath = $uploadDir . 'videos/' . $videoFilename;

if (!move_uploaded_file($videoFile['tmp_name'], $videoPath)) {
    respond(['success' => false, 'error' => 'Failed to upload video'], 500);
}

$thumbnailUrl = '';
if (isset($_FILES['thumbnail'])) {
    $thumbnailFile = $_FILES['thumbnail'];
    $allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    $maxImageSize = 5 * 1024 * 1024;
    
    if (in_array($thumbnailFile['type'], $allowedImageTypes) && $thumbnailFile['size'] <= $maxImageSize) {
        $thumbExt = pathinfo($thumbnailFile['name'], PATHINFO_EXTENSION);
        $thumbFilename = $videoUuid . '.' . $thumbExt;
        $thumbPath = $uploadDir . 'thumbnails/' . $thumbFilename;
        
        if (move_uploaded_file($thumbnailFile['tmp_name'], $thumbPath)) {
            $thumbnailUrl = 'https://moviedbr.com/uploads/thumbnails/' . $thumbFilename;
        }
    }
}

if (empty($thumbnailUrl)) {
    $thumbnailUrl = 'https://via.placeholder.com/640x360.png?text=Video+Thumbnail';
}

$videoUrl = 'https://moviedbr.com/uploads/videos/' . $videoFilename;
$tagsArray = array_filter(array_map('trim', explode(',', $tags)));
$tagsJson = json_encode($tagsArray);

$db = getDB();
$videoId = generateUUID();

if (empty($user['channel_id'])) {
    respond(['success' => false, 'error' => 'Channel not found. Please create a channel first.'], 400);
}

$channelId = $user['channel_id'];

$stmt = $db->prepare("
    INSERT INTO videos (
        id, user_id, channel_id, title, description, video_url, thumbnail,
        privacy, category, tags, is_short, created_at
    ) VALUES (
        :id, :user_id, :channel_id, :title, :description, :video_url, :thumbnail,
        :privacy, :category, :tags, :is_short, NOW()
    )
");

$stmt->execute([
    'id' => $videoId,
    'user_id' => $user['id'],
    'channel_id' => $channelId,
    'title' => $title,
    'description' => $description,
    'video_url' => $videoUrl,
    'thumbnail' => $thumbnailUrl,
    'privacy' => $privacy,
    'category' => $category,
    'tags' => $tagsJson,
    'is_short' => $isShort
]);

respond([
    'success' => true,
    'video_id' => $videoId,
    'video_url' => $videoUrl,
    'thumbnail_url' => $thumbnailUrl,
    'message' => 'Video uploaded successfully'
]);
