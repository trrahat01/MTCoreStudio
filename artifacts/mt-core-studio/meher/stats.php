<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Define the stats file path
$statsFile = __DIR__ . '/../data/device-stats.json';

// Load stats or return empty array
$stats = [];
if (file_exists($statsFile)) {
    $existing = file_get_contents($statsFile);
    if ($existing !== false) {
        $decoded = json_decode($existing, true);
        if (is_array($decoded)) {
            $stats = $decoded;
        }
    }
}

// Return stats
echo json_encode($stats);
exit;