<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireRole(['admin', 'superadmin']);

$db = getDB();

$status = $_GET['status'] ?? '';
$limit = (int)($_GET['limit'] ?? 50);
$offset = (int)($_GET['offset'] ?? 0);

$where = '';
$params = [];

if (!empty($status) && in_array($status, ['public', 'private', 'unlisted'])) {
    $where = 'WHERE v.privacy = :status';
    $params['status'] = $status;
}

$stmt = $db->prepare("
    SELECT 
        v.*,
        u.id as uploader_id,
        u.username as uploader_username,
        u.email as uploader_email
    FROM videos v
    INNER JOIN users u ON v.user_id = u.id
    $where
    ORDER BY v.created_at DESC
    LIMIT :limit OFFSET :offset
");

foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue('limit', $limit, PDO::PARAM_INT);
$stmt->bindValue('offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$videos = $stmt->fetchAll();

foreach ($videos as &$video) {
    $video['tags'] = json_decode($video['tags'] ?? '[]', true);
    $video['uploader'] = [
        'id' => $video['uploader_id'],
        'username' => $video['uploader_username'],
        'email' => $video['uploader_email']
    ];
    unset($video['uploader_id'], $video['uploader_username'], $video['uploader_email']);
}

respond([
    'success' => true,
    'videos' => $videos
]);
