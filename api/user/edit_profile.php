<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'multipart/form-data') !== false) {
    $name = isset($_POST['name']) ? trim($_POST['name']) : null;
    $bio = isset($_POST['bio']) ? trim($_POST['bio']) : null;
    $phone = isset($_POST['phone']) ? trim($_POST['phone']) : null;
    
    $profilePicPath = null;
    
    if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        $fileType = $_FILES['profile_pic']['type'];
        
        if (!in_array($fileType, $allowedTypes)) {
            respond(['success' => false, 'error' => 'Invalid file type. Only JPEG and PNG allowed'], 400);
        }
        
        if ($_FILES['profile_pic']['size'] > 5 * 1024 * 1024) {
            respond(['success' => false, 'error' => 'File too large. Maximum 5MB allowed'], 400);
        }
        
        $uploadDir = __DIR__ . '/../../uploads/profiles/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $extension = pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION);
        $filename = 'profile_' . uniqid() . '.' . $extension;
        $targetPath = $uploadDir . $filename;
        
        if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $targetPath)) {
            $profilePicPath = '/uploads/profiles/' . $filename;
            error_log("Profile picture uploaded successfully: " . $profilePicPath);
        } else {
            respond(['success' => false, 'error' => 'Failed to upload profile picture'], 500);
        }
    }
    
    $db = getDB();
    
    $updateFields = [];
    $params = ['id' => $user['id']];
    
    if ($name !== null) {
        if (empty($name)) {
            respond(['success' => false, 'error' => 'Name cannot be empty'], 400);
        }
        $updateFields[] = 'name = :name';
        $params['name'] = $name;
    }
    
    if ($bio !== null) {
        $updateFields[] = 'bio = :bio';
        $params['bio'] = $bio;
    }
    
    if ($phone !== null) {
        $updateFields[] = 'phone = :phone';
        $params['phone'] = $phone;
    }
    
    if ($profilePicPath !== null) {
        $updateFields[] = 'profile_pic = :profile_pic';
        $params['profile_pic'] = $profilePicPath;
    }
    
    if (empty($updateFields)) {
        respond(['success' => false, 'error' => 'No fields to update'], 400);
    }
    
    $updateFields[] = 'updated_at = NOW()';
    
    $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    
    error_log("Executing SQL: $sql with params: " . json_encode($params));
    
    $success = $stmt->execute($params);
    
    if (!$success) {
        error_log("Failed to update profile: " . json_encode($stmt->errorInfo()));
        respond(['success' => false, 'error' => 'Failed to update profile'], 500);
    }
    
    error_log("Profile updated successfully. Affected rows: " . $stmt->rowCount());
    
} else {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        respond(['success' => false, 'error' => 'Invalid JSON input'], 400);
    }
    
    $name = isset($input['name']) ? trim($input['name']) : null;
    $bio = isset($input['bio']) ? trim($input['bio']) : null;
    $phone = isset($input['phone']) ? trim($input['phone']) : null;
    
    $db = getDB();
    
    $updateFields = [];
    $params = ['id' => $user['id']];
    
    if ($name !== null) {
        if (empty($name)) {
            respond(['success' => false, 'error' => 'Name cannot be empty'], 400);
        }
        $updateFields[] = 'name = :name';
        $params['name'] = $name;
    }
    
    if ($bio !== null) {
        $updateFields[] = 'bio = :bio';
        $params['bio'] = $bio;
    }
    
    if ($phone !== null) {
        $updateFields[] = 'phone = :phone';
        $params['phone'] = $phone;
    }
    
    if (empty($updateFields)) {
        respond(['success' => false, 'error' => 'No fields to update'], 400);
    }
    
    $updateFields[] = 'updated_at = NOW()';
    
    $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    
    error_log("Executing SQL: $sql with params: " . json_encode($params));
    
    $success = $stmt->execute($params);
    
    if (!$success) {
        error_log("Failed to update profile: " . json_encode($stmt->errorInfo()));
        respond(['success' => false, 'error' => 'Failed to update profile'], 500);
    }
    
    error_log("Profile updated successfully. Affected rows: " . $stmt->rowCount());
}

$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user['id']]);
$updatedUser = $stmt->fetch();

if (!$updatedUser) {
    respond(['success' => false, 'error' => 'Failed to fetch updated user'], 500);
}

error_log("Returning updated user: " . json_encode(formatUserResponse($updatedUser)));

respond([
    'success' => true,
    'message' => 'Profile updated successfully',
    'user' => formatUserResponse($updatedUser)
]);
