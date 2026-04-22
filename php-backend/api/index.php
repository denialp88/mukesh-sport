<?php
// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request path
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}
$path = rtrim($path, '/');
if (empty($path)) $path = '/';

$method = $_SERVER['REQUEST_METHOD'];

// Get JSON body
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Simple router
// Health check
if ($path === '/health' && $method === 'GET') {
    echo json_encode(['status' => 'ok', 'app' => 'Mukesh Sport API', 'version' => '1.0.0']);
    exit;
}

// Auth routes
if (preg_match('#^/auth#', $path)) {
    require_once __DIR__ . '/routes/auth.php';
    exit;
}

// Customer routes
if (preg_match('#^/customers#', $path)) {
    require_once __DIR__ . '/routes/customers.php';
    exit;
}

// Repair routes - dashboard must come before /:id
if (preg_match('#^/repairs#', $path)) {
    require_once __DIR__ . '/routes/repairs.php';
    exit;
}

// Installment routes
if (preg_match('#^/installments#', $path)) {
    require_once __DIR__ . '/routes/installments.php';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Route not found']);
