<?php
// Public tracking page - no auth required
require_once __DIR__ . '/../api/config/database.php';

$token = $_GET['token'] ?? '';
if (!$token) {
    http_response_code(404);
    echo 'Not found';
    exit;
}

$db = getDB();
$stmt = $db->prepare("SELECT r.*, c.name as customer_name, c.phone as customer_phone 
                       FROM repair_jobs r JOIN customers c ON r.customer_id = c.id 
                       WHERE r.tracking_token = ? LIMIT 1");
$stmt->execute([$token]);
$job = $stmt->fetch();

if (!$job) {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Repair job not found</h1></body></html>';
    exit;
}

$stmt = $db->prepare("SELECT * FROM repair_status_history WHERE repair_job_id = ? ORDER BY created_at ASC");
$stmt->execute([$job['id']]);
$history = $stmt->fetchAll();

$statusLabels = [
    'received' => 'Received',
    'in_progress' => 'In Progress',
    'ready_for_pickup' => 'Ready for Pickup',
    'delivered' => 'Delivered',
];
$statusColors = [
    'received' => '#8b5cf6',
    'in_progress' => '#f59e0b',
    'ready_for_pickup' => '#10b981',
    'delivered' => '#3b82f6',
];
$statusIcons = [
    'received' => '📥',
    'in_progress' => '🔧',
    'ready_for_pickup' => '✅',
    'delivered' => '📦',
];

$currentStatus = $job['status'];
$statusSteps = ['received', 'in_progress', 'ready_for_pickup', 'delivered'];
$currentIdx = array_search($currentStatus, $statusSteps);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Repair - <?= htmlspecialchars($job['job_id']) ?> | Mukesh Sport</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #080d1a 0%, #0f172a 50%, #1e1b4b 100%);
            min-height: 100vh;
            color: #e2e8f0;
        }
        .container { max-width: 480px; margin: 0 auto; padding: 20px; }
        .header {
            text-align: center;
            padding: 30px 0 20px;
        }
        .logo { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: 2px; }
        .logo span { color: #f97316; }
        .subtitle { font-size: 12px; color: #64748b; letter-spacing: 3px; margin-top: 4px; text-transform: uppercase; }
        .card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 16px;
        }
        .job-id { font-size: 11px; color: #64748b; font-weight: 600; letter-spacing: 1px; }
        .item-name { font-size: 22px; font-weight: 800; color: #fff; margin: 8px 0; }
        .customer-info { font-size: 14px; color: #94a3b8; }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            margin-top: 12px;
        }
        .progress-bar {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.06);
        }
        .step { text-align: center; flex: 1; position: relative; }
        .step-dot {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 6px;
            font-size: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
        }
        .step-dot.done { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.4); }
        .step-dot.active {
            background: rgba(249,115,22,0.2);
            border-color: #f97316;
            box-shadow: 0 0 20px rgba(249,115,22,0.3);
        }
        .step-label { font-size: 10px; color: #475569; font-weight: 600; }
        .step-label.active { color: #f97316; }
        .step-label.done { color: #10b981; }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .info-label { font-size: 14px; color: #64748b; }
        .info-value { font-size: 14px; font-weight: 600; color: #e2e8f0; }
        .timeline { margin-top: 8px; }
        .timeline-item { display: flex; margin-bottom: 4px; }
        .timeline-left { width: 24px; display: flex; flex-direction: column; align-items: center; margin-right: 12px; }
        .timeline-dot { width: 10px; height: 10px; border-radius: 5px; }
        .timeline-line { width: 2px; flex: 1; background: rgba(255,255,255,0.06); margin: 4px 0; }
        .timeline-content { flex: 1; padding-bottom: 20px; }
        .timeline-status { font-size: 14px; font-weight: 600; color: #e2e8f0; }
        .timeline-date { font-size: 11px; color: #475569; margin-top: 4px; }
        .section-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 14px; }
        .footer { text-align: center; padding: 30px 0; color: #334155; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MUKESH <span>SPORT</span></div>
            <div class="subtitle">Repair Tracking</div>
        </div>

        <div class="card">
            <div class="job-id"><?= htmlspecialchars($job['job_id']) ?></div>
            <div class="item-name"><?= htmlspecialchars($job['item_name']) ?></div>
            <?php if ($job['problem_description']): ?>
                <div class="customer-info"><?= htmlspecialchars($job['problem_description']) ?></div>
            <?php endif; ?>
            <div class="customer-info" style="margin-top:8px">
                👤 <?= htmlspecialchars($job['customer_name']) ?>
            </div>
            <div class="status-badge" style="background:<?= $statusColors[$currentStatus] ?>20;color:<?= $statusColors[$currentStatus] ?>">
                <?= $statusIcons[$currentStatus] ?> <?= $statusLabels[$currentStatus] ?>
            </div>

            <div class="progress-bar">
                <?php foreach ($statusSteps as $i => $s): 
                    $isDone = $i < $currentIdx;
                    $isActive = $i === $currentIdx;
                    $cls = $isDone ? 'done' : ($isActive ? 'active' : '');
                ?>
                <div class="step">
                    <div class="step-dot <?= $cls ?>">
                        <?= $isDone ? '✓' : $statusIcons[$s] ?>
                    </div>
                    <div class="step-label <?= $cls ?>"><?= explode(' ', $statusLabels[$s])[0] ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="card">
            <div class="info-row">
                <span class="info-label">Received</span>
                <span class="info-value"><?= date('j M Y', strtotime($job['received_date'])) ?></span>
            </div>
            <?php if ($job['estimated_completion']): ?>
            <div class="info-row">
                <span class="info-label">Est. Completion</span>
                <span class="info-value"><?= date('j M Y', strtotime($job['estimated_completion'])) ?></span>
            </div>
            <?php endif; ?>
            <?php if ($job['estimated_cost']): ?>
            <div class="info-row">
                <span class="info-label">Est. Cost</span>
                <span class="info-value">Rs.<?= number_format($job['estimated_cost']) ?></span>
            </div>
            <?php endif; ?>
            <?php if ($job['final_cost']): ?>
            <div class="info-row">
                <span class="info-label">Final Cost</span>
                <span class="info-value" style="color:#f97316">Rs.<?= number_format($job['final_cost']) ?></span>
            </div>
            <?php endif; ?>
        </div>

        <?php if (count($history) > 0): ?>
        <div class="card">
            <div class="section-title">Status Timeline</div>
            <div class="timeline">
                <?php foreach ($history as $i => $h): ?>
                <div class="timeline-item">
                    <div class="timeline-left">
                        <div class="timeline-dot" style="background:<?= $statusColors[$h['status']] ?? '#8b5cf6' ?>"></div>
                        <?php if ($i < count($history) - 1): ?><div class="timeline-line"></div><?php endif; ?>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-status"><?= $statusLabels[$h['status']] ?? $h['status'] ?></div>
                        <?php if ($h['note']): ?>
                            <div style="font-size:13px;color:#94a3b8;margin-top:2px"><?= htmlspecialchars($h['note']) ?></div>
                        <?php endif; ?>
                        <div class="timeline-date"><?= date('j M Y, h:i A', strtotime($h['created_at'])) ?></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <div class="footer">Mukesh Sport &copy; <?= date('Y') ?></div>
    </div>
</body>
</html>
