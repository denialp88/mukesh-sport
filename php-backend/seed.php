<?php
// Run this ONCE after importing schema.sql to create all users
// Execute via: php seed.php (from cPanel Terminal)
require_once __DIR__ . '/api/config/database.php';

$db = getDB();

$password = password_hash('Mukesh@321', PASSWORD_BCRYPT);

$users = [
    ['name' => 'Admin', 'phone' => '7265937875', 'role' => 'admin'],
    ['name' => '9376215337', 'phone' => '9376215337', 'role' => 'staff'],
    ['name' => '7201893638', 'phone' => '7201893638', 'role' => 'staff'],
    ['name' => '8469797285', 'phone' => '8469797285', 'role' => 'staff'],
    ['name' => '7041963526', 'phone' => '7041963526', 'role' => 'staff'],
    ['name' => '8849888261', 'phone' => '8849888261', 'role' => 'staff'],
    ['name' => '7621017706', 'phone' => '7621017706', 'role' => 'staff'],
    ['name' => '7600409340', 'phone' => '7600409340', 'role' => 'staff'],
];

// First delete the dummy admin inserted by schema.sql (had invalid hash)
$db->exec("DELETE FROM users");

foreach ($users as $u) {
    $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));

    $stmt = $db->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$u['phone']]);
    if ($stmt->fetch()) {
        echo "Already exists: {$u['phone']}\n";
        continue;
    }

    $stmt = $db->prepare("INSERT INTO users (id, name, phone, password, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $u['name'], $u['phone'], $password, $u['role']]);
    echo "Created: {$u['name']} ({$u['phone']}) - {$u['role']}\n";
}

echo "\nDone! All users created with password: Mukesh@321\n";
