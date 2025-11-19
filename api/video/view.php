<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$videoId = $input['video_id'] ?? '';

if (empty($videoId)) {
    respond(['success' => false, 'error' => 'Video ID required'], 400);
}

$videoId = requireValidId($videoId, 'Video ID');

$db = getDB();

$stmt = $db->prepare("SELECT id FROM videos WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);

if (!$stmt->fetch()) {
    respond(['success' => false, 'error' => 'Video not found'], 404);
}

$stmt = $db->prepare("UPDATE videos SET views = views + 1 WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);

$stmt = $db->prepare("SELECT views FROM videos WHERE id = :video_id");
$stmt->execute(['video_id' => $videoId]);
$views = (int)$stmt->fetch()['views'];

respond([
    'success' => true,
    'views' => $views,
    'message' => 'View counted'
]);
