<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

$user = requireAuth();

respond([
    'success' => true,
    'user' => formatUserResponse($user)
]);
