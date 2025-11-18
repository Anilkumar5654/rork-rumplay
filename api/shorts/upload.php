<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

if (!isset($_FILES['video'])) {
    respond(['success' => false, 'error' => 'Video file is required'], 400);
}

$description = trim($_POST['description'] ?? '');

$uploadDir = '../uploads/';
if (!file_exists($uploadDir . 'shorts')) {
    mkdir($uploadDir . 'shorts', 0755, true);
}
if (!file_exists($uploadDir . 'thumbnails')) {
    mkdir($uploadDir . 'thumbnails', 0755, true);
}

$videoFile = $_FILES['video'];
$allowedVideoTypes = ['video/mp4', 'video/quicktime'];
$maxVideoSize = 100 * 1024 * 1024;

if (!in_array($videoFile['type'], $allowedVideoTypes)) {
    respond(['success' => false, 'error' => 'Invalid video format. Only MP4, MOV allowed'], 400);
}

if ($videoFile['size'] > $maxVideoSize) {
    respond(['success' => false, 'error' => 'Video file too large. Max 100MB'], 400);
}

$videoExt = pathinfo($videoFile['name'], PATHINFO_EXTENSION);
$videoUuid = generateUUID();
$videoFilename = $videoUuid . '.' . $videoExt;
$videoPath = $uploadDir . 'shorts/' . $videoFilename;

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
    $thumbnailUrl = 'https://via.placeholder.com/720x1280.png?text=Short';
}

$shortUrl = 'https://moviedbr.com/uploads/shorts/' . $videoFilename;

$db = getDB();
$shortId = generateUUID();
$channelId = $user['channel_id'] ?? generateUUID();

$stmt = $db->prepare("
    INSERT INTO shorts (id, user_id, channel_id, short_url, thumbnail, description, created_at)
    VALUES (:id, :user_id, :channel_id, :short_url, :thumbnail, :description, NOW())
");

$stmt->execute([
    'id' => $shortId,
    'user_id' => $user['id'],
    'channel_id' => $channelId,
    'short_url' => $shortUrl,
    'thumbnail' => $thumbnailUrl,
    'description' => $description
]);

respond([
    'success' => true,
    'short_id' => $shortId,
    'short_url' => $shortUrl,
    'thumbnail_url' => $thumbnailUrl,
    'message' => 'Short uploaded successfully'
]);
