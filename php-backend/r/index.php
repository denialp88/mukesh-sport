<?php
// Short redirect: /r/JOB_ID → /track/TOKEN
require_once __DIR__ . '/../api/config/database.php';

$jobId = $_GET['job_id'] ?? '';
if (!$jobId) {
    http_response_code(404);
    echo 'Not found';
    exit;
}

$db = getDB();
$stmt = $db->prepare("SELECT tracking_token FROM repair_jobs WHERE job_id = ? LIMIT 1");
$stmt->execute([$jobId]);
$job = $stmt->fetch();

if ($job) {
    header('Location: /track/' . $job['tracking_token']);
    exit;
}

http_response_code(404);
echo 'Not found';
