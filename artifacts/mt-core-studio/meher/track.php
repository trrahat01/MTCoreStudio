<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests for tracking
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the raw POST data
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['userAgent'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing userAgent']);
    exit;
}

$userAgent = $data['userAgent'];

// Parse user agent to get device, OS, browser details
$parsed = parseUserAgent($userAgent);

// Prepare data to store
$visit = [
    'timestamp' => date('c'),
    'deviceType' => $parsed['deviceType'] ?? 'unknown',
    'os' => $parsed['os'] ?? 'unknown',
    'browser' => $parsed['browser'] ?? 'unknown',
    'userAgent' => $userAgent // Optional, for debugging
];

// Define the stats file path (in the data directory)
$statsFile = __DIR__ . '/../data/device-stats.json';

// Ensure data directory exists
$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Load existing stats or initialize empty array
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

// Add new visit
$stats[] = $visit;

// Keep only last 1000 entries to prevent file from growing too large
if (count($stats) > 1000) {
    $stats = array_slice($stats, -1000);
}

// Save back to file
$success = file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
if ($success === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save stats']);
    exit;
}

// Return success
echo json_encode(['success' => true]);
exit;

/**
 * Simple user agent parser to extract device type, OS, and browser
 * @param string $userAgent
 * @return array
 */
function parseUserAgent($userAgent) {
    $result = [
        'deviceType' => 'desktop',
        'os' => 'unknown',
        'browser' => 'unknown'
    ];

    // Detect device type
    if (preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i', $userAgent)) {
        $result['deviceType'] = 'mobile';
    } elseif (preg_match('/tablet|ipad|playbook|silk|(android(?!.*mobile))|tablet windows|gt-p1000|sch-i800|xoom|shw-m180m|nexus 7|nexus 10|nexus 9|kindle fire|xoom|sch-i800/i', $userAgent)) {
        $result['deviceType'] = 'tablet';
    }

    // Detect OS
    if (preg_match('/windows phone/i', $userAgent)) {
        $result['os'] = 'Windows Phone';
    } elseif (preg_match('/windows nt [\d.]+/i', $userAgent)) {
        $result['os'] = 'Windows';
    } elseif (preg_match('/android [\d.]+/i', $userAgent)) {
        $result['os'] = 'Android';
    } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
        $result['os'] = 'iOS';
    } elseif (preg_match('/mac os x [\d._]+/i', $userAgent)) {
        $result['os'] = 'Mac OS';
    } elseif (preg_match('/linux/i', $userAgent)) {
        $result['os'] = 'Linux';
    }

    // Detect browser
    if (preg_match('/edge/i', $userAgent)) {
        $result['browser'] = 'Edge';
    } elseif (preg_match('/opr\//i', $userAgent)) {
        $result['browser'] = 'Opera';
    } elseif (preg_match('/chrome\/[\d.]+/i', $userAgent)) {
        $result['browser'] = 'Chrome';
    } elseif (preg_match('/safari\/[\d.]+/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
        $result['browser'] = 'Safari';
    } elseif (preg_match('/firefox\/[\d.]+/i', $userAgent)) {
        $result['browser'] = 'Firefox';
    } elseif (preg_match('/msie [\d.]+/i', $userAgent) || preg_match('/trident\//i', $userAgent)) {
        $result['browser'] = 'Internet Explorer';
    }

    return $result;
}