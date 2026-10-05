<?php
/**
 * MT Core Studio - admin configuration and shared helpers
 * -----------------------------------------------------
 * Lives inside public_html/admin/. There is NO plain-text password in this
 * file: the admin panel asks you to create a password on first visit and
 * stores only its bcrypt hash in $ADMIN_PASSWORD_HASH below.
 *
 * To reset the password: set $ADMIN_PASSWORD_HASH back to '' (between the
 * single quotes) and open /admin/ again - you will be asked to create a new
 * one. Do not share this file with anyone.
 */

declare(strict_types=1);

define('MT_ADMIN_DIR', __DIR__);
define('MT_SITE_ROOT', dirname(__DIR__));

/**
 * Bcrypt hash of the admin password. Auto-written by the setup screen.
 * Set to '' to force a password reset.
 */
$ADMIN_PASSWORD_HASH = '';

/* ------------------------------- session ---------------------------------- */

function mt_session_start(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name('mtcorestudio_admin');
        session_start();
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(16));
        }
    }
}

function mt_csrf(): string
{
    mt_session_start();
    return (string) ($_SESSION['csrf'] ?? '');
}

function mt_verify_csrf(string $token): bool
{
    mt_session_start();
    return $token !== '' && hash_equals((string) ($_SESSION['csrf'] ?? ''), $token);
}

function mt_is_logged_in(): bool
{
    mt_session_start();
    return !empty($_SESSION['mt_admin']);
}

function mt_require_login(): void
{
    if (!mt_is_logged_in()) {
        mt_json(['ok' => false, 'error' => 'Not signed in. Please log in again.'], 401);
    }
}

/* ------------------------------- helpers ---------------------------------- */

function mt_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mt_clean_text($value, int $max = 5000): string
{
    $text = trim((string) $value);
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    // Byte-truncate, then drop a partial trailing UTF-8 sequence so the result
    // is always valid UTF-8. (No mbstring extension is assumed on the host.)
    if (strlen($text) <= $max) {
        return $text;
    }
    $text = substr($text, 0, $max);
    while ($text !== '' && (ord($text[strlen($text) - 1]) & 0xC0) === 0x80) {
        $text = substr($text, 0, -1);
    }
    return $text;
}

function mt_slugify(string $value): string
{
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'app-' . substr(bin2hex(random_bytes(4)), 0, 8);
    }
    return $slug;
}

function mt_parse_package_id(string $raw): string
{
    $raw = trim($raw);
    if ($raw === '') {
        return '';
    }
    if (preg_match('/[?&]id=([^&]+)/', $raw, $m)) {
        $raw = urldecode($m[1]);
    }
    if (preg_match('/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+$/', $raw)) {
        return $raw;
    }
    return '';
}/* --------------------------- admin password hash -------------------------- */

function admin_password_hash(): string
{
    $path = MT_ADMIN_DIR . '/config.php';
    $raw = is_file($path) ? (string) file_get_contents($path) : '';
    // Match ONLY a line that begins with the top-level assignment, so a
    // '$ADMIN_PASSWORD_HASH = ...' string inside another function can never
    // be mistaken for the stored hash.
    if (preg_match('/^\$ADMIN_PASSWORD_HASH\s*=\s*\'(.*)\';/m', $raw, $m) === 1) {
        return (string) ($m[1] ?? '');
    }
    return '';
}

function mt_set_password_hash(string $hash): bool
{
    $path = MT_ADMIN_DIR . '/config.php';
    $raw = (string) file_get_contents($path);
    $lines = explode("\n", $raw);
    $updated = false;
    foreach ($lines as $i => $line) {
        if (preg_match('/^\$ADMIN_PASSWORD_HASH\s*=\s*\'/', $line)) {
            $lines[$i] = '$ADMIN_PASSWORD_HASH = ' . var_export($hash, true) . ';';
            $updated = true;
            break;
        }
    }
    if (!$updated) {
        return false;
    }
    return file_put_contents($path, implode("\n", $lines)) !== false;
}/* ------------------------------ data modules ------------------------------ */

function mt_data_path(string $file): string
{
    return MT_SITE_ROOT . '/data/' . $file;
}

function mt_module_header(string $file, string $varName): string
{
    $fallback = "// MT Core Studio - data file managed through the /admin console.\n";
    $path = mt_data_path($file);
    if (!is_file($path)) {
        return $fallback;
    }
    $raw = (string) file_get_contents($path);
    if (preg_match('/^(.*?)\nexport\s+const\s+' . preg_quote($varName, '/') . '\s*=/s', $raw, $m)) {
        return $m[1] . "\n";
    }
    return $fallback;
}

function mt_read_module(string $file, string $varName): array
{
    $path = mt_data_path($file);
    if (!is_file($path)) {
        return [];
    }
    $raw = ltrim((string) file_get_contents($path));
    $marker = 'export const ' . $varName . ' =';
    $pos = strpos($raw, $marker);
    if ($pos === false) {
        return [];
    }
    $jsonPart = substr($raw, $pos + strlen($marker));
    $jsonPart = trim($jsonPart);
    $jsonPart = rtrim($jsonPart, " \t\n\r;");
    // Try strict JSON first, then a JS-object-literal sanitizer for
    // hand-edited data files that use unquoted keys like id:
    $decoded = json_decode($jsonPart, true);
    if (is_array($decoded)) {
        return $decoded;
    }
    $sanitized = preg_replace('/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)\s*:/', '$1"$2":', $jsonPart);
    $sanitized = preg_replace('/,\s*([}\]])/', '$1', $sanitized);
    $decoded = json_decode((string) $sanitized, true);
    return is_array($decoded) ? $decoded : [];
}

function mt_write_module(array $data, string $varName, string $file): bool
{
    $header = mt_module_header($file, $varName);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    $content = $header . 'export const ' . $varName . ' = ' . $json . ";\n";
    return file_put_contents(mt_data_path($file), $content) !== false;
}

/* ------------------------------ apps helpers ------------------------------ */

function mt_normalize_app(array $app): array
{
    $fields = [
        'id', 'name', 'category', 'platform', 'description', 'icon',
        'packageName', 'playStoreUrl', 'privacyUrl', 'status',
    ];
    $out = [];
    foreach ($fields as $field) {
        $out[$field] = mt_clean_text($app[$field] ?? '', 3000);
    }
    if ($out['platform'] === '') {
        $out['platform'] = 'Android';
    }
    if ($out['status'] === '') {
        $out['status'] = 'Status to be confirmed';
    }
    if ($out['id'] === '') {
        $out['id'] = mt_slugify($out['name'] !== '' ? $out['name'] : $out['packageName']);
    }
    $out['features'] = [];
    if (!empty($app['features']) && is_array($app['features'])) {
        foreach ($app['features'] as $feature) {
            $v = mt_clean_text($feature, 300);
            if ($v !== '') {
                $out['features'][] = $v;
            }
        }
    }
    $out['screenshots'] = [];
    if (!empty($app['screenshots']) && is_array($app['screenshots'])) {
        foreach ($app['screenshots'] as $shot) {
            $v = mt_clean_text($shot, 1000);
            if ($v !== '') {
                $out['screenshots'][] = $v;
            }
        }
    }
    return $out;
}

function mt_read_apps(): array
{
    return mt_read_module('apps.js', 'apps');
}

function mt_write_apps(array $apps): bool
{
    return mt_write_module(array_values($apps), 'apps', 'apps.js');
}

/* ----------------------------- visits helpers ----------------------------- */

function mt_read_visits(): array
{
    return mt_read_module('visits.js', 'visits');
}

function mt_write_visits(array $entries): bool
{
    return mt_write_module(array_values($entries), 'visits', 'visits.js');
}

function mt_record_visit(string $page, string $country): void
{
    $entries = mt_read_visits();
    $now = time();
    $entries[] = [
        't' => $now,
        'd' => date('Y-m-d', $now),
        'p' => $page,
        'c' => $country,
    ];
    // Keep the anonymised log bounded: last 120 days and at most 10,000 rows.
    $cutoff = $now - 120 * 86400;
    $entries = array_values(array_filter($entries, static function ($e) use ($cutoff): bool {
        return (int) ($e['t'] ?? 0) >= $cutoff;
    }));
    $entries = array_slice($entries, -10000);
    mt_write_visits($entries);
}

function mt_visit_stats(): array
{
    $visits = mt_read_visits();
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $weekAgo = strtotime('-7 days 00:00:00');
    $monthAgo = strtotime('-30 days 00:00:00');

    $stats = ['today' => 0, 'yesterday' => 0, 'week' => 0, 'month' => 0, 'total' => count($visits)];
    $countries = [];
    foreach ($visits as $v) {
        $day = (string) ($v['d'] ?? '');
        $t = (int) ($v['t'] ?? 0);
        if ($day === $today) {
            $stats['today']++;
        }
        if ($day === $yesterday) {
            $stats['yesterday']++;
        }
        if ($t >= $weekAgo) {
            $stats['week']++;
        }
        if ($t >= $monthAgo) {
            $stats['month']++;
        }
        $code = strtoupper(mt_clean_text($v['c'] ?? '', 8));
        $key = $code !== '' ? $code : '??';
        $countries[$key] = ($countries[$key] ?? 0) + 1;
    }
    arsort($countries);
    return [
        'stats' => $stats,
        'countries' => $countries,
        'recent' => array_slice(array_reverse($visits), 0, 8),
    ];
}

/* ----------------------------- visit rate limit --------------------------- */

function mt_visit_rate_limited(string $id, int $windowSec = 1800, int $max = 240): bool
{
    $path = MT_ADMIN_DIR . '/.rate-limit.json';
    $log = [];
    if (is_file($path)) {
        $decoded = json_decode((string) file_get_contents($path), true);
        if (is_array($decoded)) {
            $log = $decoded;
        }
    }
    $now = time();
    $log = array_values(array_filter($log, static function ($e) use ($now): bool {
        return isset($e['t']) && (int) $e['t'] > $now - 86400;
    }));
    $count = 0;
    foreach ($log as $entry) {
        if (($entry['id'] ?? '') === $id && (int) ($entry['t'] ?? 0) > $now - $windowSec) {
            $count++;
        }
    }
    if ($count >= $max) {
        return true;
    }
    $log[] = ['id' => $id, 't' => $now];
    @file_put_contents($path, json_encode(array_slice($log, -3000)));
    return false;
}

/* ------------------------------ waitlist helpers --------------------------- */

function mt_read_waitlist(): array
{
    return mt_read_module('waitlist.js', 'waitlist');
}

function mt_write_waitlist(array $entries): bool
{
    return mt_write_module(array_values($entries), 'waitlist', 'waitlist.js');
}/* ---------------------------- site config helpers ------------------------- */

const MT_CONFIG_FIELDS = [
    'email', 'playStoreUrl', 'githubUrl', 'youtubeUrl', 'facebookUrl', 'xUrl',
    'developerName', 'country',
];

function mt_read_config(): array
{
    $config = mt_read_module('site-config.js', 'siteConfig');
    $base = [];
    foreach (MT_CONFIG_FIELDS as $field) {
        $base[$field] = (string) ($config[$field] ?? '');
    }
    $base['brandName'] = (string) ($config['brandName'] ?? 'MT Core Studio');
    $base['tagline'] = (string) ($config['tagline'] ?? 'BUILD - INNOVATE - SIMPLIFY');
    $base['developerRole'] = (string) ($config['developerRole'] ?? 'Independent Android App Developer');
    $base['websiteUrl'] = (string) ($config['websiteUrl'] ?? 'https://example.com');
    $base['canonicalDomain'] = (string) ($config['canonicalDomain'] ?? 'https://example.com');
    $base['homeTitle'] = (string) ($config['homeTitle'] ?? '');
    $base['homeDescription'] = (string) ($config['homeDescription'] ?? '');
    return $base;
}

function mt_write_config(array $config): bool
{
    $normalized = [];
    foreach (MT_CONFIG_FIELDS as $field) {
        $normalized[$field] = mt_clean_text($config[$field] ?? '', 2000);
    }
    $current = mt_read_config();
    foreach (['brandName', 'tagline', 'developerRole', 'websiteUrl', 'canonicalDomain', 'homeTitle', 'homeDescription'] as $keep) {
        $normalized[$keep] = $current[$keep];
    }
    // Preserve the optional public sections (publishedStats, roadmap) that the
    // settings form does not edit, so a settings save never wipes them.
    $full = mt_read_module('site-config.js', 'siteConfig');
    foreach (['publishedStats', 'roadmap'] as $keepArray) {
        if (isset($full[$keepArray]) && is_array($full[$keepArray])) {
            $normalized[$keepArray] = $full[$keepArray];
        }
    }
    return mt_write_module($normalized, 'siteConfig', 'site-config.js');
}

/* ------------------------------- app-ads.txt ------------------------------ */

function mt_ads_path(): string
{
    return MT_SITE_ROOT . '/app-ads.txt';
}

function mt_read_ads(): array
{
    $path = mt_ads_path();
    if (!is_file($path)) {
        return [];
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $out = [];
    foreach (is_array($lines) ? $lines : [] as $line) {
        $line = trim($line);
        if ($line !== '' && !str_starts_with($line, '#')) {
            $out[] = $line;
        }
    }
    return $out;
}

function mt_write_ads(array $lines): bool
{
    $content = "# app-ads.txt - managed through the MT Core Studio admin console.\n"
        . "# This file must stay at the ROOT of the developer website domain\n"
        . "# shown on each Google Play listing. After editing, wait at least\n"
        . "# 24 hours and check the status in AdMob -> Apps -> app-ads.txt.\n\n";
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line !== '') {
            $content .= $line . "\n";
        }
    }
    return file_put_contents(mt_ads_path(), $content) !== false;
}/* ---------------------------- Google Play import -------------------------- */

function mt_http_get(string $url): ?string
{
    $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_USERAGENT => $ua,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_ENCODING => '',
            CURLOPT_HTTPHEADER => ['Accept-Language: en-US,en;q=0.9'],
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code === 200 && is_string($body) && $body !== '') {
            return $body;
        }
        return null;
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 20,
            'header' => "User-Agent: $ua\r\nAccept: text/html,application/xhtml+xml\r\nAccept-Language: en-US,en;q=0.9\r\n",
            'ignore_errors' => true,
        ],
        'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
    ]);
    $body = @file_get_contents($url, false, $ctx);
    return is_string($body) && $body !== '' ? $body : null;
}

function mt_strip_tags_text(?string $html): string
{
    if ($html === null) {
        return '';
    }
    $text = preg_replace('/<[^>]+>/', ' ', $html) ?? $html;
    return trim((string) preg_replace('/\s+/u', ' ', $text));
}function mt_parse_play_store(string $page, string $packageId): array
{
    $data = [
        'name' => '', 'packageName' => $packageId, 'category' => '',
        'description' => '', 'icon' => '', 'developer' => '',
        'screenshots' => [], 'found' => false,
    ];
    if ($page === '') {
        return $data;
    }

    // 1) Schema.org JSON-LD block (the most reliable structured data on Play).
    if (preg_match_all('/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $page, $m)) {
        foreach ($m[1] as $block) {
            $json = json_decode(trim($block), true);
            if (!is_array($json) || ($json['@type'] ?? null) !== 'SoftwareApplication') {
                continue;
            }
            $data['found'] = true;
            $data['name'] = mt_strip_tags_text($json['name'] ?? '');
            $data['description'] = mt_strip_tags_text($json['description'] ?? '');
            $data['category'] = mt_strip_tags_text($json['applicationCategory'] ?? '');
            if (isset($json['image'])) {
                if (is_array($json['image'])) {
                    foreach ($json['image'] as $img) {
                        $img = mt_strip_tags_text($img);
                        if ($img !== '') {
                            $data['screenshots'][] = $img;
                        }
                    }
                } else {
                    $data['icon'] = mt_strip_tags_text($json['image']);
                }
            }
            $author = $json['author'] ?? null;
            if (is_array($author)) {
                $data['developer'] = mt_strip_tags_text($author['name'] ?? '');
            }
            break;
        }
    }

    // 2) HTML fallbacks for anything the JSON-LD block missed.
    $dom = new DOMDocument();
    $previous = libxml_use_internal_errors(true);
    @$dom->loadHTML('<?xml encoding="UTF-8"?>' . $page);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    $xp = new DOMXPath($dom);

    if ($data['name'] === '') {
        $node = $xp->query('//meta[@property="og:title"]')->item(0);
        if ($node) {
            $data['name'] = mt_strip_tags_text($node->getAttribute('content'));
        }
    }
    if ($data['icon'] === '') {
        $node = $xp->query('//meta[@property="og:image"]')->item(0);
        if ($node) {
            $data['icon'] = mt_strip_tags_text($node->getAttribute('content'));
        }
    }
    if ($data['category'] === '') {
        $node = $xp->query('//*[@itemprop="genre"]')->item(0);
        if ($node) {
            $data['category'] = mt_strip_tags_text($node->textContent);
        }
    }
    if (empty($data['screenshots'])) {
        $candidates = [];
        $nodes = $xp->query('//img[contains(@src,"play-lh.googleusercontent.com")]');
        foreach ($nodes as $img) {
            $src = (string) $img->getAttribute('src');
            $label = $img->getAttribute('alt') . ' ' . $img->getAttribute('aria-label');
            if ($data['icon'] !== '' && strpos($src, $data['icon']) !== false) {
                continue;
            }
            if (stripos($label, 'screenshot') !== false || count($candidates) > 0) {
                $candidates[] = $src;
            }
        }
        foreach ($candidates as $src) {
            if (!in_array($src, $data['screenshots'], true)) {
                $data['screenshots'][] = $src;
            }
            if (count($data['screenshots']) >= 8) {
                break;
            }
        }
    }

    // Dedupe screenshots and drop the icon if it leaked into the list.
    $clean = [];
    foreach ($data['screenshots'] as $shot) {
        if ($shot === '' || ($data['icon'] !== '' && strpos($shot, $data['icon']) !== false)) {
            continue;
        }
        if (!in_array($shot, $clean, true)) {
            $clean[] = $shot;
        }
    }
    $data['screenshots'] = array_slice($clean, 0, 8);

    // Ask Google's image CDN for a tidy 512px copy of the icon.
    if ($data['icon'] !== '') {
        $fixed = preg_replace('/=[wh][0-9]+(?:-[wh][0-9]+)?-?[a-z]*/', '=w512', $data['icon']);
        $data['icon'] = $fixed !== null ? $fixed : $data['icon'];
    }
    return $data;
}

function mt_download_image(string $url, string $dest): bool
{
    $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
    @mkdir(dirname($dest), 0775, true);
    $body = null;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_USERAGENT => $ua,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create([
            'http' => ['timeout' => 20, 'header' => "User-Agent: $ua\r\n"],
            'ssl' => ['verify_peer' => false],
        ]);
        $body = @file_get_contents($url, false, $ctx);
    }
    if (!is_string($body) || $body === '') {
        return false;
    }
    $mime = '';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? (string) finfo_buffer($finfo, $body) : '';
    }
    if ($mime !== '' && strpos($mime, 'image/') !== 0) {
        return false;
    }
    return file_put_contents($dest, $body) !== false;
}