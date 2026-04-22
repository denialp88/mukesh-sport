<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../middleware/auth.php';

$db = getDB();

// POST /api/auth/login
if ($path === '/auth/login' && $method === 'POST') {
    $phone = $body['phone'] ?? '';
    $password = $body['password'] ?? '';

    if (!$phone || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Phone and password are required.']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE phone = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$phone]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid phone or password.']);
        exit;
    }

    $token = jwt_encode([
        'id' => $user['id'],
        'name' => $user['name'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'exp' => time() + (30 * 24 * 60 * 60), // 30 days
    ], JWT_SECRET);

    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'phone' => $user['phone'],
            'role' => $user['role'],
        ],
    ]);
    exit;
}

// POST /api/auth/register (Admin only)
if ($path === '/auth/register' && $method === 'POST') {
    $authUser = authenticate();
    authorizeAdmin($authUser);

    $name = $body['name'] ?? '';
    $phone = $body['phone'] ?? '';
    $password = $body['password'] ?? '';
    $role = $body['role'] ?? 'staff';

    if (!$name || !$phone || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, phone, and password are required.']);
        exit;
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'User with this phone already exists.']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $id = gen_uuid();

    $stmt = $db->prepare("INSERT INTO users (id, name, phone, password, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $name, $phone, $hashedPassword, $role]);

    echo json_encode([
        'user' => ['id' => $id, 'name' => $name, 'phone' => $phone, 'role' => $role],
    ]);
    exit;
}

// PUT /api/auth/profile
if ($path === '/auth/profile' && $method === 'PUT') {
    $authUser = authenticate();
    $name = $body['name'] ?? '';

    if (!$name || !trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required.']);
        exit;
    }

    $stmt = $db->prepare("UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([trim($name), $authUser['id']]);

    $stmt = $db->prepare("SELECT id, name, phone, role FROM users WHERE id = ?");
    $stmt->execute([$authUser['id']]);
    $user = $stmt->fetch();

    echo json_encode(['user' => $user]);
    exit;
}

// Helper: generate UUID
function gen_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

http_response_code(404);
echo json_encode(['error' => 'Auth route not found']);
