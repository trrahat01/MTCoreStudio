<?php
/**
 * MT Core Studio - admin API (JSON)
 * All state-changing actions require login plus a valid CSRF token.
 */

require __DIR__ . '/config.php';

mt_session_start();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$action = mt_clean_text($_POST['action'] ?? ($_GET['action'] ?? ''), 40);

/* ------------------------- sign in / first run ---------------------------- */

if ($action === 'login') {
    $hash = admin_password_hash();

    if ($hash === '') {
        $password = (string) base64_decode((string) ($_POST['password'] ?? ''));
        $password2 = (string) base64_decode((string) ($_POST['password2'] ?? ''));
        if (strlen($password) < 8) {
            mt_json(['ok' => false, 'error' => 'Password must be at least 8 characters.'], 400);
        }
        if ($password !== $password2) {
            mt_json(['ok' => false, 'error' => 'The two passwords do not match.'], 400);
        }
        if (!mt_set_password_hash(password_hash($password, PASSWORD_DEFAULT))) {
            mt_json(['ok' => false, 'error' => 'Could not save the password hash. Make sure admin/config.php is writable by PHP.'], 500);
        }
        $_SESSION['mt_admin'] = true;
        mt_json(['ok' => true, 'firstRun' => true]);
    }

    $password = (string) base64_decode((string) ($_POST['password'] ?? ''));
    if ($password === '' || !password_verify($password, $hash)) {
        mt_json(['ok' => false, 'error' => 'Incorrect password.'], 403);
    }
    session_regenerate_id(true);
    $_SESSION['mt_admin'] = true;
    mt_json(['ok' => true]);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    mt_json(['ok' => true]);
}

/* --------------------------- authenticated area --------------------------- */

mt_require_login();
if (!mt_verify_csrf((string) ($_POST['csrf'] ?? ''))) {
    mt_json(['ok' => false, 'error' => 'Invalid security token. Please reload the page and try again.'], 403);
}

if ($action === 'list') {
    mt_json([
        'ok' => true,
        'apps' => mt_read_apps(),
        'config' => mt_read_config(),
        'ads' => mt_read_ads(),
        'categories' => ['Productivity', 'Education', 'Lifestyle', 'Entertainment', 'Tools', 'Other'],
    ]);
}

if ($action === 'save-app') {
    $apps = mt_read_apps();
    $appRaw = (string) ($_POST['app'] ?? '[]');
    $appDecoded = json_decode($appRaw, true);
    $app = mt_normalize_app(is_array($appDecoded) ? $appDecoded : []);
    if ($app['name'] === '') {
        mt_json(['ok' => false, 'error' => 'App name is required.'], 400);
    }

    $originalId = mt_clean_text($_POST['originalId'] ?? '', 200);
    $found = false;
    $updated = [];
    foreach ($apps as $existing) {
        $existingId = (string) ($existing['id'] ?? '');
        if ($originalId !== '' && $existingId === $originalId) {
            $updated[] = $app;
            $found = true;
        } else {
            $updated[] = $existing;
        }
    }
    if (!$found) {
        $updated[] = $app;
    }
    if (!mt_write_apps($updated)) {
        mt_json(['ok' => false, 'error' => 'Could not write data/apps.js. Check that the data folder is writable by PHP.'], 500);
    }
    mt_json(['ok' => true, 'apps' => $updated]);
}

if ($action === 'delete-app') {
    $id = mt_clean_text($_POST['id'] ?? '', 200);
    $apps = mt_read_apps();
    $updated = array_values(array_filter($apps, static function ($a) use ($id): bool {
        return (string) ($a['id'] ?? '') !== $id;
    }));
    if (!mt_write_apps($updated)) {
        mt_json(['ok' => false, 'error' => 'Could not write data/apps.js. Check file permissions.'], 500);
    }
    mt_json(['ok' => true, 'apps' => $updated]);
}

if ($action === 'save-config') {
    if (!mt_write_config((array) $_POST)) {
        mt_json(['ok' => false, 'error' => 'Could not write data/site-config.js. Check file permissions.'], 500);
    }
    mt_json(['ok' => true, 'config' => mt_read_config()]);
}

if ($action === 'save-ads') {
    $lines = [];
    foreach ((array) ($_POST['lines'] ?? []) as $line) {
        $line = mt_clean_text($line, 500);
        if ($line !== '') {
            $lines[] = $line;
        }
    }
    if (!mt_write_ads($lines)) {
        mt_json(['ok' => false, 'error' => 'Could not write app-ads.txt. Check file permissions.'], 500);
    }
    mt_json(['ok' => true, 'ads' => $lines]);
}

if ($action === 'import-play') {
    $raw = mt_clean_text($_POST['url'] ?? '', 2000);
    $packageId = mt_parse_package_id($raw);
    if ($packageId === '') {
        mt_json([
            'ok' => false,
            'error' => 'Enter a Google Play URL or a package ID, for example "https://play.google.com/store/apps/details?id=com.example.app" or just "com.example.app".',
        ], 400);
    }

    $page = mt_http_get('https://play.google.com/store/apps/details?id=' . urlencode($packageId) . '&hl=en&gl=US');
    if ($page === null) {
        mt_json(['ok' => false, 'error' => 'Could not reach Google Play right now. Check your hosting outbound connection, or enter the app details manually.'], 502);
    }

    $info = mt_parse_play_store((string) $page, $packageId);
    if (!$info['found'] && $info['name'] === '') {
        mt_json(['ok' => false, 'error' => 'Could not read details for that package. The app may be unavailable on the US store, or Google blocked the request. Enter the details manually instead.'], 404);
    }

    $iconSaved = '';
    if ($info['icon'] !== '') {
        $slug = mt_slugify($packageId);
        $dest = MT_SITE_ROOT . '/assets/apps/' . $slug . '.png';
        if (mt_download_image($info['icon'], $dest)) {
            $iconSaved = 'assets/apps/' . $slug . '.png';
        }
    }

    mt_json(['ok' => true, 'info' => $info, 'iconSaved' => $iconSaved]);
}

if ($action === 'waitlist-list') {
    mt_json(['ok' => true, 'waitlist' => mt_read_waitlist()]);
}

if ($action === 'waitlist-clear') {
    if (!mt_write_waitlist([])) {
        mt_json(['ok' => false, 'error' => 'Could not clear data/waitlist.js. Check file permissions.'], 500);
    }
    mt_json(['ok' => true, 'waitlist' => []]);
}

/* ---------------------------- visitors / statistics ----------------------- */

if ($action === 'visits-stats') {
    $stats = mt_visit_stats();
    mt_json(['ok' => true, 'stats' => $stats['stats'], 'countries' => $stats['countries'], 'recent' => $stats['recent']]);
}

if ($action === 'visits-clear') {
    if (!mt_write_visits([])) {
        mt_json(['ok' => false, 'error' => 'Could not clear data/visits.js. Check file permissions.'], 500);
    }
    mt_json(['ok' => true, 'stats' => mt_visit_stats()['stats'], 'countries' => []]);
}

if ($action === 'visits-export') {
    $visits = mt_read_visits();
    $rows = [["date", "page", "country"]];
    foreach (array_reverse($visits) as $v) {
        $country = (string) ($v['c'] ?? '');
        $rows[] = [
            (string) ($v['d'] ?? ''),
            (string) ($v['p'] ?? ''),
            $country !== '' ? $country : 'unknown',
        ];
    }
    $fh = fopen('php://temp', 'r+');
    foreach ($rows as $row) {
        fputcsv($fh, $row, ',', '"', '\\');
    }
    rewind($fh);
    $csv = (string) stream_get_contents($fh);
    fclose($fh);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="mt-core-studio-visits.csv"');
    echo "\xEF\xBB\xBF" . $csv;
    exit;
}

mt_json(['ok' => false, 'error' => 'Unknown action.'], 400);