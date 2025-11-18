<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$category = $_GET['category'] ?? '';
$limit = min(max((int)($_GET['limit'] ?? 20), 1), 100);
$offset = max((int)($_GET['offset'] ?? 0), 0);
$sort = $_GET['sort'] ?? 'latest';

$db = getDB();

$where = "WHERE v.privacy = 'public'";
$params = [];

if (!empty($category)) {
    $where .= " AND v.category = :category";
    $params['category'] = $category;
}

$orderBy = match($sort) {
    'popular' => 'ORDER BY v.views DESC',
    'trending' => 'ORDER BY v.likes DESC, v.views DESC',
    default => 'ORDER BY v.created_at DESC'
};

$stmt = $db->prepare("
    SELECT 
        v.*,
        u.id as uploader_id,
        u.username as uploader_username,
        u.name as uploader_name,
        u.profile_pic as uploader_profile_pic
    FROM videos v
    INNER JOIN users u ON v.user_id = u.id
    $where
    $orderBy
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
        'name' => $video['uploader_name'],
        'profile_pic' => $video['uploader_profile_pic']
    ];
    unset($video['uploader_id'], $video['uploader_username'], $video['uploader_name'], $video['uploader_profile_pic']);
}

$stmt = $db->prepare("SELECT COUNT(*) as total FROM videos v $where");
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->execute();
$total = $stmt->fetch()['total'];

respond([
    'success' => true,
    'videos' => $videos,
    'total' => (int)$total,
    'limit' => $limit,
    'offset' => $offset
]);
