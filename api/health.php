<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'error' => 'Method not allowed'], 405);
}

try {
    $db = getDB();
    $stmt = $db->query("SELECT 1");
    $dbStatus = 'connected';
} catch (Exception $e) {
    $dbStatus = 'error';
}

respond([
    'success' => true,
    'status' => 'OK',
    'database' => $dbStatus,
    'timestamp' => date('Y-m-d\TH:i:s\Z')
]);
