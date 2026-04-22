<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$db = getDB();
$authUser = authenticate();

function gen_uuid_inst() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// GET /api/installments/dashboard/summary — must be before other routes
if ($path === '/installments/dashboard/summary' && $method === 'GET') {
    $stmt = $db->query("SELECT SUM(remaining_balance) as total_pending, SUM(total_price) as total_credit, COUNT(*) as active_count FROM installment_plans WHERE status = 'active'");
    $active = $stmt->fetch();

    $stmt = $db->query("SELECT COUNT(*) as completed_count FROM installment_plans WHERE status = 'completed'");
    $completed = $stmt->fetch();

    echo json_encode([
        'total_pending' => (float)($active['total_pending'] ?? 0),
        'total_credit' => (float)($active['total_credit'] ?? 0),
        'active_count' => (int)($active['active_count'] ?? 0),
        'completed_count' => (int)($completed['completed_count'] ?? 0),
    ]);
    exit;
}

// GET /api/installments/plans
if ($path === '/installments/plans' && $method === 'GET') {
    $status = $_GET['status'] ?? '';
    $customer_id = $_GET['customer_id'] ?? '';
    $from_date = $_GET['from_date'] ?? '';
    $to_date = $_GET['to_date'] ?? '';

    $sql = "SELECT p.*, c.name as customer_name, c.phone as customer_phone 
            FROM installment_plans p JOIN customers c ON p.customer_id = c.id WHERE 1=1";
    $params = [];

    if ($status) { $sql .= " AND p.status = ?"; $params[] = $status; }
    if ($customer_id) { $sql .= " AND p.customer_id = ?"; $params[] = $customer_id; }
    if ($from_date) { $sql .= " AND p.created_at >= ?"; $params[] = $from_date; }
    if ($to_date) { $sql .= " AND p.created_at <= ?"; $params[] = $to_date . ' 23:59:59'; }

    $sql .= " ORDER BY p.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['plans' => $stmt->fetchAll()]);
    exit;
}

// GET /api/installments/plans/:id
if (preg_match('#^/installments/plans/([a-f0-9\-]+)$#', $path, $m) && $method === 'GET') {
    $id = $m[1];

    $stmt = $db->prepare("SELECT p.*, c.name as customer_name, c.phone as customer_phone 
                           FROM installment_plans p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?");
    $stmt->execute([$id]);
    $plan = $stmt->fetch();

    if (!$plan) {
        http_response_code(404);
        echo json_encode(['error' => 'Plan not found.']);
        exit;
    }

    $stmt = $db->prepare("SELECT i.*, u.name as recorded_by_name, u.phone as recorded_by_phone 
                           FROM installments i LEFT JOIN users u ON i.recorded_by = u.id 
                           WHERE i.plan_id = ? ORDER BY i.installment_number ASC");
    $stmt->execute([$id]);
    $installments = $stmt->fetchAll();

    echo json_encode(['plan' => $plan, 'installments' => $installments]);
    exit;
}

// POST /api/installments/plans
if ($path === '/installments/plans' && $method === 'POST') {
    $customer_id = $body['customer_id'] ?? '';
    $product_name = $body['product_name'] ?? '';
    $total_price = $body['total_price'] ?? 0;

    if (!$customer_id || !$product_name || !$total_price) {
        http_response_code(400);
        echo json_encode(['error' => 'customer_id, product_name, and total_price are required.']);
        exit;
    }

    $dp = (float)($body['down_payment'] ?? 0);
    $remaining = (float)$total_price - $dp;
    $numInstallments = (int)($body['total_installments'] ?? 1);
    $emiAmount = round($remaining / $numInstallments, 2);
    $startDate = $body['start_date'] ?? date('Y-m-d');

    $id = gen_uuid_inst();
    $stmt = $db->prepare("INSERT INTO installment_plans (id, customer_id, created_by, product_name, category, brand, model, total_price, down_payment, remaining_balance, total_installments, installment_amount, frequency, start_date, notes) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id, $customer_id, $authUser['id'], $product_name,
        $body['category'] ?? null, $body['brand'] ?? null, $body['model'] ?? null,
        $total_price, $dp, $remaining, $numInstallments, $emiAmount,
        $body['frequency'] ?? 'custom', $startDate, $body['notes'] ?? null,
    ]);

    $stmt = $db->prepare("SELECT * FROM installment_plans WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['plan' => $stmt->fetch()]);
    exit;
}

// POST /api/installments/plans/:id/add-payment
if (preg_match('#^/installments/plans/([a-f0-9\-]+)/add-payment$#', $path, $m) && $method === 'POST') {
    $planId = $m[1];
    $amount = (float)($body['amount'] ?? 0);
    $payment_mode = $body['payment_mode'] ?? 'cash';
    $note = $body['note'] ?? null;

    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'A valid payment amount is required.']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM installment_plans WHERE id = ?");
    $stmt->execute([$planId]);
    $plan = $stmt->fetch();
    if (!$plan) { http_response_code(404); echo json_encode(['error' => 'Plan not found.']); exit; }

    $newBalance = max(0, (float)$plan['remaining_balance'] - $amount);

    // Get next installment number
    $stmt = $db->prepare("SELECT MAX(installment_number) as max_num FROM installments WHERE plan_id = ?");
    $stmt->execute([$planId]);
    $row = $stmt->fetch();
    $nextNum = ($row['max_num'] ?? 0) + 1;

    $today = date('Y-m-d');
    $payId = gen_uuid_inst();
    $stmt = $db->prepare("INSERT INTO installments (id, plan_id, installment_number, amount, due_date, paid_date, paid_amount, payment_mode, status, receipt_note, recorded_by) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)");
    $stmt->execute([$payId, $planId, $nextNum, $amount, $today, $today, $amount, $payment_mode, $note, $authUser['id']]);

    // Update plan balance
    $updateSql = "UPDATE installment_plans SET remaining_balance = ?, updated_at = NOW()";
    $updateParams = [$newBalance];
    if ($newBalance == 0) { $updateSql .= ", status = 'completed'"; }
    $updateSql .= " WHERE id = ?";
    $updateParams[] = $planId;
    $stmt = $db->prepare($updateSql);
    $stmt->execute($updateParams);

    $stmt = $db->prepare("SELECT * FROM installments WHERE id = ?");
    $stmt->execute([$payId]);
    $payment = $stmt->fetch();

    $stmt = $db->prepare("SELECT * FROM installment_plans WHERE id = ?");
    $stmt->execute([$planId]);
    $updatedPlan = $stmt->fetch();

    echo json_encode(['payment' => $payment, 'plan' => $updatedPlan]);
    exit;
}

// PUT /api/installments/:id/pay
if (preg_match('#^/installments/([a-f0-9\-]+)/pay$#', $path, $m) && $method === 'PUT') {
    $id = $m[1];

    $stmt = $db->prepare("SELECT * FROM installments WHERE id = ?");
    $stmt->execute([$id]);
    $installment = $stmt->fetch();
    if (!$installment) { http_response_code(404); echo json_encode(['error' => 'Installment not found.']); exit; }

    $today = date('Y-m-d');
    $paid_amount = $body['paid_amount'] ?? $installment['amount'];
    $payment_mode = $body['payment_mode'] ?? 'cash';
    $receipt_note = $body['receipt_note'] ?? null;

    $stmt = $db->prepare("UPDATE installments SET status='paid', paid_date=?, paid_amount=?, payment_mode=?, receipt_note=?, updated_at=NOW() WHERE id=?");
    $stmt->execute([$today, $paid_amount, $payment_mode, $receipt_note, $id]);

    // Check if all installments paid
    $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM installments WHERE plan_id = ? AND status != 'paid'");
    $stmt->execute([$installment['plan_id']]);
    $pending = $stmt->fetch();

    if ((int)$pending['cnt'] === 0) {
        $stmt = $db->prepare("UPDATE installment_plans SET status='completed', updated_at=NOW() WHERE id=?");
        $stmt->execute([$installment['plan_id']]);
    }

    $stmt = $db->prepare("SELECT * FROM installments WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['installment' => $stmt->fetch()]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Installment route not found']);
