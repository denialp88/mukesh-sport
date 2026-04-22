<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$db = getDB();
$authUser = authenticate();

function gen_uuid_repair() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function generateJobId() {
    $y = date('Y');
    $m = date('m');
    $d = date('d');
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $suffix = '';
    for ($i = 0; $i < 4; $i++) $suffix .= $chars[mt_rand(0, strlen($chars) - 1)];
    return "MKS-{$y}{$m}{$d}-{$suffix}";
}

function generateToken($len = 20) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    $token = '';
    for ($i = 0; $i < $len; $i++) $token .= $chars[mt_rand(0, strlen($chars) - 1)];
    return $token;
}

// GET /api/repairs/dashboard/summary — must be before /:id
if ($path === '/repairs/dashboard/summary' && $method === 'GET') {
    $stmt = $db->query("SELECT status, COUNT(*) as cnt FROM repair_jobs WHERE status IN ('received','in_progress','ready_for_pickup') GROUP BY status");
    $rows = $stmt->fetchAll();
    $counts = ['received' => 0, 'in_progress' => 0, 'ready_for_pickup' => 0];
    foreach ($rows as $r) $counts[$r['status']] = (int)$r['cnt'];

    echo json_encode([
        'received' => $counts['received'],
        'in_progress' => $counts['in_progress'],
        'ready_for_pickup' => $counts['ready_for_pickup'],
        'total_active' => $counts['received'] + $counts['in_progress'] + $counts['ready_for_pickup'],
    ]);
    exit;
}

// GET /api/repairs
if ($path === '/repairs' && $method === 'GET') {
    $status = $_GET['status'] ?? '';
    $search = $_GET['search'] ?? '';
    $from_date = $_GET['from_date'] ?? '';
    $to_date = $_GET['to_date'] ?? '';

    $sql = "SELECT r.*, c.name as customer_name, c.phone as customer_phone 
            FROM repair_jobs r JOIN customers c ON r.customer_id = c.id WHERE 1=1";
    $params = [];

    if ($status) { $sql .= " AND r.status = ?"; $params[] = $status; }
    if ($from_date) { $sql .= " AND r.received_date >= ?"; $params[] = $from_date; }
    if ($to_date) { $sql .= " AND r.received_date <= ?"; $params[] = $to_date; }
    if ($search) {
        $sql .= " AND (r.job_id LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR r.item_name LIKE ?)";
        $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%";
    }

    $sql .= " ORDER BY r.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['jobs' => $stmt->fetchAll()]);
    exit;
}

// GET /api/repairs/:id
if (preg_match('#^/repairs/([a-f0-9\-]+)$#', $path, $m) && $method === 'GET') {
    $id = $m[1];

    $stmt = $db->prepare("SELECT r.*, c.name as customer_name, c.phone as customer_phone 
                           FROM repair_jobs r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?");
    $stmt->execute([$id]);
    $job = $stmt->fetch();

    if (!$job) {
        http_response_code(404);
        echo json_encode(['error' => 'Repair job not found.']);
        exit;
    }

    $stmt = $db->prepare("SELECT h.*, u.name as updated_by_name, u.phone as updated_by_phone 
                           FROM repair_status_history h LEFT JOIN users u ON h.updated_by = u.id 
                           WHERE h.repair_job_id = ? ORDER BY h.created_at ASC");
    $stmt->execute([$id]);
    $history = $stmt->fetchAll();

    echo json_encode(['job' => $job, 'history' => $history]);
    exit;
}

// POST /api/repairs
if ($path === '/repairs' && $method === 'POST') {
    $customer_id = $body['customer_id'] ?? '';
    $item_name = $body['item_name'] ?? '';

    if (!$customer_id || !$item_name) {
        http_response_code(400);
        echo json_encode(['error' => 'customer_id and item_name are required.']);
        exit;
    }

    $id = gen_uuid_repair();
    $jobId = generateJobId();
    $trackingToken = generateToken(20);
    $today = date('Y-m-d');

    $stmt = $db->prepare("INSERT INTO repair_jobs (id, job_id, tracking_token, customer_id, created_by, item_name, problem_description, item_photo_url, estimated_cost, estimated_completion, received_date, status, notes) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)");
    $stmt->execute([
        $id, $jobId, $trackingToken, $customer_id, $authUser['id'],
        $item_name,
        $body['problem_description'] ?? null,
        $body['item_photo_url'] ?? null,
        $body['estimated_cost'] ?? null,
        $body['estimated_completion'] ?? null,
        $today,
        $body['notes'] ?? null,
    ]);

    // Add initial status history
    $hId = gen_uuid_repair();
    $stmt = $db->prepare("INSERT INTO repair_status_history (id, repair_job_id, updated_by, status, note) VALUES (?, ?, ?, 'received', 'Item received for repair.')");
    $stmt->execute([$hId, $id, $authUser['id']]);

    $stmt = $db->prepare("SELECT * FROM repair_jobs WHERE id = ?");
    $stmt->execute([$id]);
    $job = $stmt->fetch();

    $trackingUrl = 'https://mukeshsports.in/track/' . $trackingToken;
    echo json_encode(['job' => $job, 'tracking_url' => $trackingUrl]);
    exit;
}

// PUT /api/repairs/:id/status
if (preg_match('#^/repairs/([a-f0-9\-]+)/status$#', $path, $m) && $method === 'PUT') {
    $id = $m[1];
    $status = $body['status'] ?? '';
    $payment_received = $body['payment_received'] ?? null;

    // If only updating payment status
    if ($payment_received !== null && !$status) {
        $stmt = $db->prepare("UPDATE repair_jobs SET payment_received = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$payment_received ? 1 : 0, $id]);
        $stmt = $db->prepare("SELECT * FROM repair_jobs WHERE id = ?");
        $stmt->execute([$id]);
        $job = $stmt->fetch();
        if (!$job) { http_response_code(404); echo json_encode(['error' => 'Repair job not found.']); exit; }
        echo json_encode(['job' => $job]);
        exit;
    }

    $validStatuses = ['received', 'in_progress', 'ready_for_pickup', 'delivered'];
    if (!in_array($status, $validStatuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status.']);
        exit;
    }

    $today = date('Y-m-d');
    $sql = "UPDATE repair_jobs SET status = ?, updated_at = NOW()";
    $params = [$status];

    if ($status === 'delivered') { $sql .= ", delivered_date = ?"; $params[] = $today; }
    if ($status === 'ready_for_pickup' || $status === 'delivered') { $sql .= ", completed_date = ?"; $params[] = $today; }
    if ($payment_received !== null) { $sql .= ", payment_received = ?"; $params[] = $payment_received ? 1 : 0; }

    $sql .= " WHERE id = ?";
    $params[] = $id;
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $stmt = $db->prepare("SELECT * FROM repair_jobs WHERE id = ?");
    $stmt->execute([$id]);
    $job = $stmt->fetch();
    if (!$job) { http_response_code(404); echo json_encode(['error' => 'Repair job not found.']); exit; }

    // Add status history
    $hId = gen_uuid_repair();
    $stmt = $db->prepare("INSERT INTO repair_status_history (id, repair_job_id, updated_by, status, note, photo_url) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$hId, $id, $authUser['id'], $status, $body['note'] ?? null, $body['photo_url'] ?? null]);

    echo json_encode(['job' => $job]);
    exit;
}

// PUT /api/repairs/:id/cost
if (preg_match('#^/repairs/([a-f0-9\-]+)/cost$#', $path, $m) && $method === 'PUT') {
    $id = $m[1];
    $final_cost = $body['final_cost'] ?? null;

    $stmt = $db->prepare("UPDATE repair_jobs SET final_cost = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$final_cost, $id]);

    $stmt = $db->prepare("SELECT * FROM repair_jobs WHERE id = ?");
    $stmt->execute([$id]);
    $job = $stmt->fetch();
    if (!$job) { http_response_code(404); echo json_encode(['error' => 'Repair job not found.']); exit; }

    echo json_encode(['job' => $job]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Repair route not found']);
