<?php
require __DIR__ . '/config.php';
mt_session_start();

$loggedIn = mt_is_logged_in();
$firstRun = admin_password_hash() === '';
$csrf = mt_csrf();
$host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>MT Core Studio - Admin</title>
<link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg">
<link rel="stylesheet" href="admin.css">
</head>
<body class="<?php echo $loggedIn ? 'is-auth' : 'is-login'; ?>">

<div class="page">

<?php if (!$loggedIn): ?>

  <section class="card login-card">
    <div class="card-head">
      <img src="../assets/images/mt-core-studio-logo.png" alt="MT Core Studio logo" width="72" height="48">
      <div>
        <h1>MT Core Studio <span>Admin</span></h1>
        <p><?php echo $firstRun ? 'Create a password to secure this console.' : 'Sign in to manage the website.'; ?></p>
      </div>
    </div>

    <?php if ($firstRun): ?>
      <p class="notice">First run: choose a strong admin password (at least 8 characters). It is stored only as a secure hash and never displayed again.</p>
      <label>New password
        <input type="password" id="pw1" autocomplete="new-password" minlength="8" required>
      </label>
      <label>Repeat password
        <input type="password" id="pw2" autocomplete="new-password" minlength="8" required>
      </label>
      <button type="button" class="btn" id="btn-create">Create password &amp; enter</button>
    <?php else: ?>
      <label>Password
        <input type="password" id="pw1" autocomplete="current-password" required>
      </label>
      <button type="button" class="btn" id="btn-login">Sign in</button>
    <?php endif; ?>

    <p class="status" id="login-status" role="status"></p>
  </section>

<?php else: ?>

  <header class="topbar">
    <div class="topbar-brand">
      <img src="../assets/images/mt-core-studio-logo.png" alt="" width="60" height="40">
      <strong>MT Core Studio - Admin</strong>
    </div>
    <div class="topbar-actions">
      <a class="btn btn-ghost" href="../index.html" target="_blank" rel="noopener">View site ^</a>
      <button class="btn btn-ghost" type="button" id="btn-logout">Sign out</button>
    </div>
  </header>
  <main class="content">

    <section class="card">
      <div class="card-head">
        <div><h2>Apps</h2><p>Add, edit or remove apps. Changes go live immediately on the public website.</p></div>
        <button class="btn" type="button" id="btn-new-app">+ New app</button>
      </div>
      <div id="apps-list" class="apps-list" aria-live="polite"></div>
      <p class="status muted" id="apps-status"></p>
    </section>

    <section class="card">
      <div class="card-head">
        <div><h2>Waitlist</h2><p>Emails captured from the "Notify me" forms on app pages. Export to CSV to import into your mail tool.</p></div>
        <div class="row">
          <button class="btn" type="button" id="btn-waitlist-export">Export CSV</button>
          <button class="btn btn-danger" type="button" id="btn-waitlist-clear">Clear all</button>
        </div>
      </div>
      <div id="waitlist-list" class="waitlist-list" aria-live="polite"></div>
      <p class="status muted" id="waitlist-status"></p>
    </section>

    <section class="card">
      <div class="card-head">
        <div><h2>Visitors</h2><p>Anonymised traffic from the visit beacon (page + date + approximate country). No IP addresses or cookies are stored. Cleared automatically after 120 days.</p></div>
        <div class="row">
          <button class="btn" type="button" id="btn-visits-export">Export CSV</button>
          <button class="btn btn-danger" type="button" id="btn-visits-clear">Clear all</button>
        </div>
      </div>
      <div id="visits-stats" class="visits-stats" aria-live="polite"></div>
      <p class="status muted" id="visits-status"></p>
    </section>

    <section class="card" id="editor" hidden>
      <div class="card-head">
        <div><h2 id="editor-title">Add a new app</h2>
        <p>Tip: paste a Google Play link below to auto-fill most fields.</p></div>
        <button class="btn btn-ghost" type="button" id="btn-cancel">Cancel</button>
      </div>

      <div class="import-panel">
        <label for="import-url">Google Play link or package ID <span class="muted">(e.g. com.example.app)</span></label>
        <div class="row">
          <input type="text" id="import-url" placeholder="https://play.google.com/store/apps/details?id=com.example.app">
          <button class="btn" type="button" id="btn-import">Fetch details</button>
        </div>
        <p class="status" id="import-status" role="status"></p>
      </div>

      <form id="app-form" autocomplete="off">
        <input type="hidden" id="f-original-id">
        <div class="grid">
          <label>App name *
            <input type="text" id="f-name" required>
          </label>
          <label>Category
            <input type="text" id="f-category" list="category-list" placeholder="Lifestyle">
            <datalist id="category-list">
              <option value="Productivity"></option>
              <option value="Education"></option>
              <option value="Lifestyle"></option>
              <option value="Entertainment"></option>
              <option value="Tools"></option>
              <option value="Other"></option>
            </datalist>
          </label>
          <label>Status
            <select id="f-status">
              <option>Status to be confirmed</option>
              <option>In development</option>
              <option>Published</option>
            </select>
          </label>
          <label>App ID / slug <span class="muted">(URL: app.html?id=...)</span>
            <input type="text" id="f-id" placeholder="auto-from-name">
          </label>
          <label>Package name
            <input type="text" id="f-package" placeholder="com.mtcorestudio.example">
          </label>
          <label>Google Play URL
            <input type="url" id="f-play-url" placeholder="https://play.google.com/store/apps/details?id=...">
          </label>
          <label>Privacy policy URL
            <input type="url" id="f-privacy-url" placeholder="https://.../privacy.html">
          </label>
          <label>Icon path <span class="muted">(optional)</span>
            <input type="text" id="f-icon" placeholder="assets/apps/example.png">
          </label>
        </div>
        <label>Short description
          <textarea id="f-description" rows="3" maxlength="2000"></textarea>
        </label>
        <label>Features <span class="muted">(one per line)</span>
          <textarea id="f-features" rows="5"></textarea>
        </label>
        <label>Screenshot URLs <span class="muted">(one per line, optional)</span>
          <textarea id="f-screenshots" rows="3"></textarea>
        </label>
        <div class="row">
          <button class="btn btn-primary" type="submit" id="btn-save">Save app</button>
          <span class="status" id="save-status" role="status"></span>
        </div>
      </form>
    </section>
    <section class="card">
      <div class="card-head">
        <div><h2>Site settings</h2><p>Public contact channels and developer profile details shown on the website.</p></div>
      </div>
      <form id="settings-form" autocomplete="off">
        <div class="grid">
          <label>Support email
            <input type="email" id="s-email" placeholder="support@mtcorestudio.com">
          </label>
          <label>Google Play developer page
            <input type="url" id="s-play" placeholder="https://play.google.com/store/apps/dev?id=...">
          </label>
          <label>GitHub
            <input type="url" id="s-github" placeholder="https://github.com/...">
          </label>
          <label>YouTube
            <input type="url" id="s-youtube" placeholder="https://youtube.com/...">
          </label>
          <label>Facebook
            <input type="url" id="s-facebook" placeholder="https://facebook.com/...">
          </label>
          <label>X (Twitter)
            <input type="url" id="s-x" placeholder="https://x.com/...">
          </label>
          <label>Developer name
            <input type="text" id="s-devname" placeholder="Your name or studio name">
          </label>
          <label>Country
            <input type="text" id="s-country" placeholder="Region">
          </label>
        </div>
        <div class="row">
          <button class="btn btn-primary" type="submit">Save settings</button>
          <span class="status" id="settings-status" role="status"></span>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-head">
        <div><h2>app-ads.txt</h2><p>Used by AdMob to verify your app inventory. Hosted automatically at the site root.</p></div>
      </div>
      <p class="muted">One advertising line per row, for example: <code>google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0</code><br>
      Public URL: <code>https://<?php echo htmlspecialchars($host, ENT_QUOTES, 'UTF-8'); ?>/app-ads.txt</code></p>
      <form id="ads-form">
        <label class="sr-only" for="ads-lines">app-ads.txt lines</label>
        <textarea id="ads-lines" rows="5" placeholder="google.com, pub-..., DIRECT, f08c47fec0942fa0"></textarea>
        <div class="row">
          <button class="btn btn-primary" type="submit">Save app-ads.txt</button>
          <span class="status" id="ads-status" role="status"></span>
        </div>
      </form>
    </section>

  </main>

<?php endif; ?>

</div>

<script>
  var MT_CSRF = <?php echo json_encode($csrf, JSON_UNESCAPED_SLASHES); ?>;
  var MT_LOGGED_IN = <?php echo $loggedIn ? 'true' : 'false'; ?>;
  var MT_FIRST_RUN = <?php echo $firstRun ? 'true' : 'false'; ?>;
</script>
<script src="admin.js"></script>
</body>
</html>