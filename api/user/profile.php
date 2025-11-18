<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? '';
    
    if (empty($userId)) {
        respond(['success' => false, 'error' => 'User ID required'], 400);
    }
    
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        respond(['success' => false, 'error' => 'User not found'], 404);
    }
    
    respond(['success' => true, 'user' => formatUserResponse($user)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($input['name'] ?? $user['name']);
    $bio = trim($input['bio'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $profilePic = trim($input['profile_pic'] ?? $user['profile_pic'] ?? '');
    
    if (empty($name)) {
        respond(['success' => false, 'error' => 'Name is required'], 400);
    }
    
    $db = getDB();
    $stmt = $db->prepare("
        UPDATE users 
        SET name = :name, bio = :bio, phone = :phone, profile_pic = :profile_pic, updated_at = NOW()
        WHERE id = :id
    ");
    
    $success = $stmt->execute([
        'name' => $name,
        'bio' => $bio,
        'phone' => $phone,
        'profile_pic' => $profilePic,
        'id' => $user['id']
    ]);
    
    if (!$success) {
        respond(['success' => false, 'error' => 'Failed to update profile'], 500);
    }
    
    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    $updatedUser = $stmt->fetch();
    
    respond([
        'success' => true, 
        'message' => 'Profile updated',
        'user' => formatUserResponse($updatedUser)
    ]);
}

respond(['success' => false, 'error' => 'Method not allowed'], 405);
