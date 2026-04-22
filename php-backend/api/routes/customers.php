<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$db = getDB();
$authUser = authenticate();

// Helper: generate UUID
function gen_uuid_cust() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// GET /api/customers
if ($path === '/customers' && $method === 'GET') {
    $search = $_GET['search'] ?? '';
    $sql = "SELECT * FROM customers";
    $params = [];

    if ($search) {
        $sql .= " WHERE name LIKE ? OR phone LIKE ?";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $sql .= " ORDER BY created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['customers' => $stmt->fetchAll()]);
    exit;
}

// GET /api/customers/:id
if (preg_match('#^/customers/([a-f0-9\-]+)$#', $path, $m) && $method === 'GET') {
    $id = $m[1];

    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch();

    if (!$customer) {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found.']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM installment_plans WHERE customer_id = ? ORDER BY created_at DESC");
    $stmt->execute([$id]);
    $installmentPlans = $stmt->fetchAll();

    $stmt = $db->prepare("SELECT * FROM repair_jobs WHERE customer_id = ? ORDER BY created_at DESC");
    $stmt->execute([$id]);
    $repairJobs = $stmt->fetchAll();

    echo json_encode(['customer' => $customer, 'installmentPlans' => $installmentPlans, 'repairJobs' => $repairJobs]);
    exit;
}

// POST /api/customers
if ($path === '/customers' && $method === 'POST') {
    $name = $body['name'] ?? '';
    $phone = $body['phone'] ?? '';
    $address = $body['address'] ?? null;
    $photo_url = $body['photo_url'] ?? null;

    if (!$name || !$phone) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and phone are required.']);
        exit;
    }

    $id = gen_uuid_cust();
    $stmt = $db->prepare("INSERT INTO customers (id, name, phone, address, photo_url) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $name, $phone, $address, $photo_url]);

    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['customer' => $stmt->fetch()]);
    exit;
}

// PUT /api/customers/:id
if (preg_match('#^/customers/([a-f0-9\-]+)$#', $path, $m) && $method === 'PUT') {
    $id = $m[1];
    $name = $body['name'] ?? '';
    $phone = $body['phone'] ?? '';
    $address = $body['address'] ?? null;
    $photo_url = $body['photo_url'] ?? null;

    $stmt = $db->prepare("UPDATE customers SET name=?, phone=?, address=?, photo_url=?, updated_at=NOW() WHERE id=?");
    $stmt->execute([$name, $phone, $address, $photo_url, $id]);

    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch();

    if (!$customer) {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found.']);
        exit;
    }

    echo json_encode(['customer' => $customer]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Customer route not found']);
