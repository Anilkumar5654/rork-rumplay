<?php
error_log('[video_screen.php] Request received: ' . json_encode($_GET + $_POST));
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? 'fetch';
$videoId = $_GET['video_id'] ?? $_POST['video_id'] ?? '';
$authUser = getAuthUser();

if (empty($videoId)) {
    respond(['success' => false, 'error' => 'Video ID required'], 400);
}

$videoId = requireValidId($videoId, 'Video ID');

try {
    $db = getDB();
} catch (Exception $e) {
    error_log('[video_screen.php] Database error: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'Database connection failed'], 500);
}

switch ($action) {
    case 'fetch':
        handleFetch($db, $videoId, $authUser);
        break;
    
    case 'like':
    case 'unlike':
    case 'dislike':
    case 'undislike':
        handleReaction($db, $videoId, $action, $authUser);
        break;
    
    case 'comment':
        handleComment($db, $videoId, $authUser);
        break;
    
    case 'subscribe':
    case 'unsubscribe':
        handleSubscription($db, $videoId, $action, $authUser);
        break;
    
    case 'increment_view':
        handleIncrementView($db, $videoId);
        break;
    
    default:
        respond(['success' => false, 'error' => 'Invalid action'], 400);
}

function handleFetch($db, $videoId, $authUser) {
    error_log('[video_screen.php] Fetching video data: ' . $videoId);
    
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
        error_log('[video_screen.php] Video not found: ' . $videoId);
        respond(['success' => false, 'error' => 'Video not found'], 404);
    }
    
    error_log('[video_screen.php] Video found: ' . $video['title']);
    
    $video['tags'] = json_decode($video['tags'] ?? '[]', true);
    $video['uploader'] = [
        'id' => $video['uploader_id'],
        'username' => $video['uploader_username'],
        'name' => $video['uploader_name'],
        'profile_pic' => $video['uploader_profile_pic'],
        'channel_id' => $video['uploader_channel_id']
    ];
    unset($video['uploader_id'], $video['uploader_username'], $video['uploader_name'], $video['uploader_profile_pic'], $video['uploader_channel_id']);
    
    $video['is_liked'] = false;
    $video['is_disliked'] = false;
    $video['is_saved'] = false;
    
    if ($authUser) {
        $stmt = $db->prepare("
            SELECT COUNT(*) as is_liked
            FROM video_likes
            WHERE video_id = :video_id AND user_id = :user_id
        ");
        $stmt->execute([
            'video_id' => $videoId,
            'user_id' => $authUser['id']
        ]);
        $video['is_liked'] = (int)$stmt->fetch()['is_liked'] > 0;
    }
    
    $channelId = $video['channel_id'];
    $stmt = $db->prepare("
        SELECT 
            c.*
        FROM channels c
        WHERE c.id = :channel_id
    ");
    $stmt->execute(['channel_id' => $channelId]);
    $channel = $stmt->fetch();
    
    if ($channel) {
        $channel['is_subscribed'] = false;
        if ($authUser) {
            $stmt = $db->prepare("
                SELECT COUNT(*) as is_subscribed
                FROM subscriptions
                WHERE user_id = :user_id AND creator_id = :channel_id
            ");
            $stmt->execute([
                'user_id' => $authUser['id'],
                'channel_id' => $channelId
            ]);
            $channel['is_subscribed'] = (int)$stmt->fetch()['is_subscribed'] > 0;
        }
    }
    
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
    
    $category = $video['category'] ?? '';
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
        WHERE v.id != :video_id
        AND v.privacy = 'public'
        AND (v.category = :category OR 1=1)
        ORDER BY v.views DESC, v.created_at DESC
        LIMIT 20
    ");
    $stmt->execute([
        'video_id' => $videoId,
        'category' => $category
    ]);
    $recommended = $stmt->fetchAll();
    
    foreach ($recommended as &$recVideo) {
        $recVideo['uploader'] = [
            'id' => $recVideo['uploader_id'],
            'username' => $recVideo['uploader_username'],
            'name' => $recVideo['uploader_name'],
            'profile_pic' => $recVideo['uploader_profile_pic']
        ];
        unset($recVideo['uploader_id'], $recVideo['uploader_username'], $recVideo['uploader_name'], $recVideo['uploader_profile_pic']);
    }
    
    respond([
        'success' => true,
        'video' => $video,
        'channel' => $channel,
        'comments' => $comments,
        'recommended' => $recommended
    ]);
}

function handleReaction($db, $videoId, $action, $authUser) {
    if (!$authUser) {
        respond(['success' => false, 'error' => 'Unauthorized'], 401);
    }
    
    error_log('[video_screen.php] Reaction: ' . $action . ' for video: ' . $videoId);
    
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
            'user_id' => $authUser['id']
        ]);
        
        if ($stmt->rowCount() > 0) {
            $stmt = $db->prepare("UPDATE videos SET likes = likes + 1 WHERE id = :video_id");
            $stmt->execute(['video_id' => $videoId]);
        }
        
        $message = 'Video liked';
    } elseif ($action === 'unlike') {
        $stmt = $db->prepare("DELETE FROM video_likes WHERE video_id = :video_id AND user_id = :user_id");
        $stmt->execute([
            'video_id' => $videoId,
            'user_id' => $authUser['id']
        ]);
        
        if ($stmt->rowCount() > 0) {
            $stmt = $db->prepare("UPDATE videos SET likes = GREATEST(likes - 1, 0) WHERE id = :video_id");
            $stmt->execute(['video_id' => $videoId]);
        }
        
        $message = 'Video unliked';
    } elseif ($action === 'dislike') {
        $stmt = $db->prepare("UPDATE videos SET dislikes = dislikes + 1 WHERE id = :video_id");
        $stmt->execute(['video_id' => $videoId]);
        $message = 'Video disliked';
    } elseif ($action === 'undislike') {
        $stmt = $db->prepare("UPDATE videos SET dislikes = GREATEST(dislikes - 1, 0) WHERE id = :video_id");
        $stmt->execute(['video_id' => $videoId]);
        $message = 'Dislike removed';
    }
    
    $stmt = $db->prepare("SELECT likes, dislikes FROM videos WHERE id = :video_id");
    $stmt->execute(['video_id' => $videoId]);
    $counts = $stmt->fetch();
    
    respond([
        'success' => true,
        'message' => $message,
        'likes' => (int)$counts['likes'],
        'dislikes' => (int)$counts['dislikes']
    ]);
}

function handleComment($db, $videoId, $authUser) {
    if (!$authUser) {
        respond(['success' => false, 'error' => 'Unauthorized'], 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $comment = $input['comment'] ?? '';
    
    if (empty(trim($comment))) {
        respond(['success' => false, 'error' => 'Comment text required'], 400);
    }
    
    error_log('[video_screen.php] Adding comment to video: ' . $videoId);
    
    $stmt = $db->prepare("SELECT id FROM videos WHERE id = :video_id");
    $stmt->execute(['video_id' => $videoId]);
    if (!$stmt->fetch()) {
        respond(['success' => false, 'error' => 'Video not found'], 404);
    }
    
    $commentId = generateUUID();
    $stmt = $db->prepare("
        INSERT INTO video_comments (id, video_id, user_id, comment, created_at)
        VALUES (:id, :video_id, :user_id, :comment, NOW())
    ");
    $stmt->execute([
        'id' => $commentId,
        'video_id' => $videoId,
        'user_id' => $authUser['id'],
        'comment' => trim($comment)
    ]);
    
    respond([
        'success' => true,
        'message' => 'Comment added',
        'comment_id' => $commentId
    ]);
}

function handleSubscription($db, $videoId, $action, $authUser) {
    if (!$authUser) {
        respond(['success' => false, 'error' => 'Unauthorized'], 401);
    }
    
    error_log('[video_screen.php] Subscription action: ' . $action . ' for video: ' . $videoId);
    
    $stmt = $db->prepare("SELECT channel_id FROM videos WHERE id = :video_id");
    $stmt->execute(['video_id' => $videoId]);
    $video = $stmt->fetch();
    
    if (!$video) {
        respond(['success' => false, 'error' => 'Video not found'], 404);
    }
    
    $channelId = $video['channel_id'];
    
    $stmt = $db->prepare("SELECT id, user_id FROM channels WHERE id = :channel_id");
    $stmt->execute(['channel_id' => $channelId]);
    $channel = $stmt->fetch();
    
    if (!$channel) {
        respond(['success' => false, 'error' => 'Channel not found'], 404);
    }
    
    if ($channel['user_id'] === $authUser['id']) {
        respond(['success' => false, 'error' => 'You cannot subscribe to your own channel'], 400);
    }
    
    if ($action === 'subscribe') {
        $stmt = $db->prepare("
            SELECT id FROM subscriptions 
            WHERE user_id = :user_id AND creator_id = :channel_id
        ");
        $stmt->execute([
            'user_id' => $authUser['id'],
            'channel_id' => $channelId
        ]);
        
        if ($stmt->fetch()) {
            respond(['success' => false, 'error' => 'Already subscribed'], 400);
        }
        
        $subscriptionId = generateUUID();
        $stmt = $db->prepare("
            INSERT INTO subscriptions (id, user_id, creator_id, notifications, created_at)
            VALUES (:id, :user_id, :creator_id, 1, NOW())
        ");
        $stmt->execute([
            'id' => $subscriptionId,
            'user_id' => $authUser['id'],
            'creator_id' => $channelId
        ]);
        
        $stmt = $db->prepare("
            UPDATE channels 
            SET subscriber_count = subscriber_count + 1 
            WHERE id = :channel_id
        ");
        $stmt->execute(['channel_id' => $channelId]);
        
        $message = 'Subscribed successfully';
    } else {
        $stmt = $db->prepare("
            DELETE FROM subscriptions 
            WHERE user_id = :user_id AND creator_id = :channel_id
        ");
        $stmt->execute([
            'user_id' => $authUser['id'],
            'channel_id' => $channelId
        ]);
        
        if ($stmt->rowCount() > 0) {
            $stmt = $db->prepare("
                UPDATE channels 
                SET subscriber_count = GREATEST(subscriber_count - 1, 0) 
                WHERE id = :channel_id
            ");
            $stmt->execute(['channel_id' => $channelId]);
        }
        
        $message = 'Unsubscribed successfully';
    }
    
    $stmt = $db->prepare("SELECT subscriber_count FROM channels WHERE id = :channel_id");
    $stmt->execute(['channel_id' => $channelId]);
    $subscriberCount = (int)$stmt->fetch()['subscriber_count'];
    
    respond([
        'success' => true,
        'message' => $message,
        'subscriber_count' => $subscriberCount
    ]);
}

function handleIncrementView($db, $videoId) {
    error_log('[video_screen.php] Incrementing view for video: ' . $videoId);
    
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
}
