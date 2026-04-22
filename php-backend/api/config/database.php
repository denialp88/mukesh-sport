<?php
// Database configuration - UPDATE THESE after creating MySQL DB in cPanel
define('DB_HOST', 'localhost');
define('DB_NAME', 'mukeshsp_db');       // Will be set after cPanel DB creation
define('DB_USER', 'mukeshsp_user');     // Will be set after cPanel DB creation  
define('DB_PASS', 'MukeshSport2024!'); // Will be set after cPanel DB creation
define('JWT_SECRET', 'mukesh-sport-jwt-secret-2024-very-secure-key');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
