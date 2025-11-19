<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$videoId = $_GET['video_id'] ?? '';
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 20;

$db = getDB();

if (!empty($videoId)) {
    $videoId = requireValidId($videoId, 'Video ID');
    $stmt = $db->prepare("SELECT category, tags FROM videos WHERE id = :video_id");
    $stmt->execute(['video_id' => $videoId]);
    $currentVideo = $stmt->fetch();
    
    if ($currentVideo) {
        $category = $currentVideo['category'] ?? '';
        $tags = json_decode($currentVideo['tags'] ?? '[]', true);
        
        $query = "
            SELECT 
                v.id,
                v.title,
                v.video_url,
                v.thumbnail,
                v.views,
                v.likes,
                v.duration,
                v.category,
                v.created_at,
                u.id as uploader_id,
                u.username as uploader_username,
                u.name as uploader_name,
                u.profile_pic as uploader_profile_pic
            FROM videos v
            INNER JOIN users u ON v.user_id = u.id
            WHERE v.id != :video_id
            AND v.privacy = 'public'
            AND (v.category = :category OR 1=1)
            ORDER BY v.views DESC, v.created_at DESC
            LIMIT :limit
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue('video_id', $videoId, PDO::PARAM_STR);
        $stmt->bindValue('category', $category, PDO::PARAM_STR);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT 
                v.id,
                v.title,
                v.video_url,
                v.thumbnail,
                v.views,
                v.likes,
                v.duration,
                v.category,
                v.created_at,
                u.id as uploader_id,
                u.username as uploader_username,
                u.name as uploader_name,
                u.profile_pic as uploader_profile_pic
            FROM videos v
            INNER JOIN users u ON v.user_id = u.id
            WHERE v.privacy = 'public'
            ORDER BY v.views DESC, v.created_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
    }
} else {
    $stmt = $db->prepare("
        SELECT 
            v.id,
            v.title,
            v.video_url,
            v.thumbnail,
            v.views,
            v.likes,
            v.duration,
            v.category,
            v.created_at,
            u.id as uploader_id,
            u.username as uploader_username,
            u.name as uploader_name,
            u.profile_pic as uploader_profile_pic
        FROM videos v
        INNER JOIN users u ON v.user_id = u.id
        WHERE v.privacy = 'public'
        ORDER BY v.views DESC, v.created_at DESC
        LIMIT :limit
    ");
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
}

$videos = $stmt->fetchAll();

foreach ($videos as &$video) {
    $video['uploader'] = [
        'id' => $video['uploader_id'],
        'username' => $video['uploader_username'],
        'name' => $video['uploader_name'],
        'profile_pic' => $video['uploader_profile_pic']
    ];
    unset($video['uploader_id'], $video['uploader_username'], $video['uploader_name'], $video['uploader_profile_pic']);
}

respond([
    'success' => true,
    'videos' => $videos
]);
