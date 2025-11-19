<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

define('DB_HOST', 'localhost');
define('DB_USER', 'u449340066_rumplay');
define('DB_PASS', '6>E/UCiT;AYh');
define('DB_NAME', 'u449340066_rumplay');

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database connection failed']);
            exit();
        }
    }
    return $db;
}

/**
 * Generates a 32-character UUID (no hyphens) for database consistency
 * Database uses char(32) format: d4bc569e090acbbc17354bd3657adb4d
 * 
 * @return string 32-character UUID without hyphens
 */
function generateUUID() {
    return sprintf(
        '%04x%04x%04x%04x%04x%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function generateToken() {
    return bin2hex(random_bytes(48));
}

function hashPassword($password) {
    $salt = bin2hex(random_bytes(16));
    $hash = hash('sha256', $password . $salt);
    return ['hash' => $hash, 'salt' => $salt];
}

function verifyPassword($password, $hash, $salt) {
    return hash('sha256', $password . $salt) === $hash;
}

function getAuthUser() {
    try {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            return null;
        }
        
        $token = trim($matches[1]);
        if (empty($token)) {
            return null;
        }
        
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT u.* FROM users u
            INNER JOIN sessions s ON u.id = s.user_id
            WHERE s.token = :token AND s.expires_at > NOW()
        ");
        $stmt->execute(['token' => $token]);
        
        $user = $stmt->fetch();
        
        if (!$user) {
            error_log('[getAuthUser] No valid session found for token');
            return null;
        }
        
        return $user;
    } catch (Exception $e) {
        error_log('[getAuthUser] Error: ' . $e->getMessage());
        return null;
    }
}

function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    return $user;
}

function requireRole($allowedRoles) {
    $user = requireAuth();
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit();
    }
    return $user;
}

function respond($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Normalizes ID to 32-character format (removes hyphens)
 * Supports both 32-char (d4bc569e090acbbc17354bd3657adb4d) 
 * and 36-char (550e8400-e29b-41d4-a716-446655440000) formats
 * 
 * @param string $id The ID to normalize
 * @return string|null Normalized 32-character ID or null if invalid
 */
function normalizeId($id) {
    if (empty($id) || !is_string($id)) {
        return null;
    }
    
    $clean = str_replace('-', '', trim($id));
    
    if (strlen($clean) !== 32) {
        error_log('[normalizeId] Invalid ID length: ' . strlen($clean) . ' (expected 32). ID: ' . $id);
        return null;
    }
    
    if (!ctype_xdigit($clean)) {
        error_log('[normalizeId] Invalid ID format (not hex): ' . $id);
        return null;
    }
    
    return strtolower($clean);
}

/**
 * Validates and normalizes ID, throws error response if invalid
 * 
 * @param string $id The ID to validate
 * @param string $fieldName Name of the field for error message
 * @return string Normalized 32-character ID
 */
function requireValidId($id, $fieldName = 'ID') {
    $normalized = normalizeId($id);
    
    if ($normalized === null) {
        respond([
            'success' => false, 
            'error' => $fieldName . ' is invalid. Expected 32-character format.',
            'debug' => [
                'received' => $id,
                'length' => strlen($id ?? ''),
                'expected_format' => 'd4bc569e090acbbc17354bd3657adb4d'
            ]
        ], 400);
    }
    
    return $normalized;
}

function formatUserResponse($user) {
    return [
        'id' => $user['id'],
        'username' => $user['username'],
        'displayName' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'avatar' => $user['profile_pic'],
        'bio' => $user['bio'],
        'phone' => $user['phone'],
        'channelId' => $user['channel_id'],
        'subscriptions' => json_decode($user['subscriptions'] ?? '[]', true),
        'memberships' => json_decode($user['memberships'] ?? '[]', true),
        'reactions' => json_decode($user['reactions'] ?? '[]', true),
        'watchHistory' => json_decode($user['watch_history'] ?? '[]', true),
        'watchHistoryDetailed' => json_decode($user['watch_history_detailed'] ?? '[]', true),
        'savedVideos' => json_decode($user['saved_videos'] ?? '[]', true),
        'likedVideos' => json_decode($user['liked_videos'] ?? '[]', true),
        'createdAt' => $user['created_at']
    ];
}
