<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();
$input = json_decode(file_get_contents('php://input'), true);

error_log("Update Profile Input: " . json_encode($input));
error_log("Current User ID: " . $user['id']);

$name = isset($input['name']) ? trim($input['name']) : $user['name'];
$bio = isset($input['bio']) ? trim($input['bio']) : ($user['bio'] ?? '');
$phone = isset($input['phone']) ? trim($input['phone']) : ($user['phone'] ?? '');

$profilePic = $user['profile_pic'] ?? '';
if (isset($input['profile_pic']) && !empty($input['profile_pic'])) {
    $profilePic = trim($input['profile_pic']);
}

if (empty($name)) {
    respond(['success' => false, 'error' => 'Name is required'], 400);
}

error_log("Updating user with: name=$name, bio=$bio, phone=$phone, profile_pic=$profilePic");

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
    error_log("Failed to update user: " . json_encode($stmt->errorInfo()));
    respond(['success' => false, 'error' => 'Failed to update profile'], 500);
}

error_log("User updated successfully. Affected rows: " . $stmt->rowCount());

$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user['id']]);
$updatedUser = $stmt->fetch();

error_log("Updated user data: " . json_encode($updatedUser));

respond([
    'success' => true, 
    'message' => 'Profile updated successfully',
    'user' => formatUserResponse($updatedUser)
]);
