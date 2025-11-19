<?php
require_once '../db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$category = $_GET['category'] ?? 'All';
$limit = min(max((int)($_GET['limit'] ?? 20), 1), 100);
$offset = max((int)($_GET['offset'] ?? 0), 0);

try {
    $db = getDB();
    
    // Get regular videos (non-shorts)
    $where = "WHERE v.privacy = 'public' AND (v.is_short = 0 OR v.is_short IS NULL)";
    $params = [];
    
    if ($category !== 'All' && !empty($category)) {
        $where .= " AND v.category = :category";
        $params['category'] = $category;
    }
    
    $stmt = $db->prepare("
        SELECT 
            v.video_id,
            v.title,
            v.description,
            v.thumbnail_url,
            v.video_url,
            v.views,
            v.likes,
            v.duration,
            v.category,
            v.created_at,
            v.is_short,
            u.id as user_id,
            u.name as channel_name,
            u.profile_pic as channel_avatar,
            c.channel_id,
            c.channel_name as channel_display_name
        FROM videos v
        INNER JOIN users u ON v.user_id = u.id
        LEFT JOIN channels c ON u.id = c.user_id
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
    
    $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get shorts
    $shortsStmt = $db->prepare("
        SELECT 
            v.video_id,
            v.title,
            v.description,
            v.thumbnail_url,
            v.video_url,
            v.views,
            v.likes,
            v.duration,
            v.category,
            v.created_at,
            v.is_short,
            u.id as user_id,
            u.name as channel_name,
            u.profile_pic as channel_avatar,
            c.channel_id,
            c.channel_name as channel_display_name
        FROM videos v
        INNER JOIN users u ON v.user_id = u.id
        LEFT JOIN channels c ON u.id = c.user_id
        WHERE v.privacy = 'public' AND v.is_short = 1
        ORDER BY v.created_at DESC
        LIMIT 10
    ");
    $shortsStmt->execute();
    $shorts = $shortsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format videos
    $formattedVideos = array_map(function($video) {
        return [
            'id' => $video['video_id'],
            'title' => $video['title'],
            'description' => $video['description'],
            'thumbnail' => $video['thumbnail_url'] ?: 'https://picsum.photos/1280/720?random=' . substr($video['video_id'], 0, 5),
            'videoUrl' => $video['video_url'],
            'channelId' => $video['channel_id'] ?: $video['user_id'],
            'channelName' => $video['channel_display_name'] ?: $video['channel_name'],
            'channelAvatar' => $video['channel_avatar'] ?: 'https://api.dicebear.com/7.x/thumbs/svg?seed=' . $video['user_id'],
            'views' => (int)$video['views'],
            'likes' => (int)$video['likes'],
            'uploadDate' => $video['created_at'],
            'duration' => (int)$video['duration'],
            'category' => $video['category'] ?: 'General',
            'isShort' => (bool)$video['is_short']
        ];
    }, $videos);
    
    // Format shorts
    $formattedShorts = array_map(function($short) {
        return [
            'id' => $short['video_id'],
            'title' => $short['title'],
            'description' => $short['description'],
            'thumbnail' => $short['thumbnail_url'] ?: 'https://picsum.photos/720/1280?random=' . substr($short['video_id'], 0, 5),
            'videoUrl' => $short['video_url'],
            'channelId' => $short['channel_id'] ?: $short['user_id'],
            'channelName' => $short['channel_display_name'] ?: $short['channel_name'],
            'channelAvatar' => $short['channel_avatar'] ?: 'https://api.dicebear.com/7.x/thumbs/svg?seed=' . $short['user_id'],
            'views' => (int)$short['views'],
            'likes' => (int)$short['likes'],
            'uploadDate' => $short['created_at'],
            'duration' => (int)$short['duration'],
            'category' => $short['category'] ?: 'General',
            'isShort' => true
        ];
    }, $shorts);
    
    respond([
        'success' => true,
        'videos' => $formattedVideos,
        'shorts' => $formattedShorts,
        'total' => count($formattedVideos),
        'category' => $category
    ]);
    
} catch (Exception $e) {
    error_log("Home feed error: " . $e->getMessage());
    respond(['success' => false, 'error' => 'Failed to fetch home feed'], 500);
}
