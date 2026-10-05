# MT Core Studio — InfinityFree upload guide

This is a **static website**: HTML5 + CSS3 + vanilla JavaScript. There is **no
Node.js or database requirement — the public pages are plain static HTML/CSS/JS**. Two optional
features use the free PHP included on every InfinityFree account: the **admin console** (`admin/`,
for editing apps in the browser) and the **launch waitlist** (`api/waitlist.php`, so visitors can
join per-app waitlists). The files run exactly as they
are. All app information lives in one editable data file, so the site stays
easy to maintain as the app collection grows.

---

## 1. Which files to upload

Using the InfinityFree **File Manager** or an FTP client, upload the
**contents** of this folder into your `public_html` directory (do not upload
the project wrapper folder itself).

The top level of `public_html` must contain:

```
index.html          Home
apps.html           App directory (search + filters)
app.html            App details (works with ?id=...)
about.html          About page
updates.html        Changelog / release notes
app-privacy.html    Per-app privacy policy template
developer.html      Developer profile
publisher.html      Publisher information
contact.html        Contact page
privacy.html        Privacy policy
blog.html           Studio notes
robots.txt          Search engines
sitemap.xml         Search engines
feed.xml            RSS feed (regenerate with node tools/generate-feed.mjs)
site.webmanifest    PWA manifest (install the site as an app)
sw.js               Service worker (offline + install prompt)
css/style.css       Styles (dark + light theme)
js/main.js          Site logic (vanilla)
api/waitlist.php    Public waitlist endpoint (needs PHP - included free on InfinityFree)
api/visit.php       Anonymous visit beacon (needs PHP - powers the admin Visitors stats)
app-ads.txt         AdMob app-ads.txt verification
.htaccess           Root Apache config (protects data/visits.js + data/waitlist.js)
admin/              Optional PHP admin console (apps, settings, waitlist, visitors)
data/apps.js        ★ App directory data — edit this to add apps
data/posts.js       Blog posts
data/changelog.js   Release notes (updates.html + app pages)
data/waitlist.js    Waitlist emails (written by the waitlist endpoint)
data/visits.js      Anonymised visit log (written by the visit beacon, read in admin)
data/site-config.js ★ Public profile / contact settings
assets/images/      Logo, favicon, PWA icons
assets/apps/        App icons (add your own files here)
tools/              Optional helpers (RSS feed generator)
```

No build step is needed — these files work on InfinityFree as-is.
(An optional Vite build can create a smaller optimized copy in `dist/public/`,
but it is not required for hosting.)

After uploading, visit `https://yourdomain.infinityfreeapp.com/` and check
every page from the navigation.

---

## 2. Where the logo goes

The official logo is **`assets/images/mt-core-studio-logo.png`** (already used
in the navbar, hero, footer, and page icons).

- To replace or update it, overwrite that file with your new logo PNG and keep
  the same file name.
- `assets/images/favicon.svg` is a small wrapper that embeds the same logo for
  the browser tab and shortcut icons. It needs no changes.
- Do not rename `assets/images/` — every page references those paths.

---

## 3. Where app icons go

Put each app's icon square in:

```
assets/apps/<app-id>.png      e.g. assets/apps/daily-spark.png
```

Then set the `icon` field for that app in `data/apps.js`:

```js
icon: "assets/apps/daily-spark.png",
```

While `icon` is empty the site shows a neat monogram tile instead, so nothing
breaks if an icon is missing. Recommended size: 512 × 512 px PNG.

---

## 4. How to add a new app

Open **`data/apps.js`** and add one object to the `apps` array:

```js
{
  id: "your-app-id",               // lowercase, used in app.html?id=your-app-id
  name: "Your App Name",
  category: "Tools",               // Productivity | Education | Lifestyle
                                   // Entertainment | Tools | Other (or new)
  platform: "Android",
  description: "One or two honest sentences describing the app.",
  icon: "",                        // e.g. "assets/apps/your-app-id.png"
  screenshots: [],                 // e.g. ["assets/apps/your-app-id-1.png"]
  features: ["Feature one", "Feature two"],
  packageName: "",                 // e.g. "com.mtcorestudio.yourapp"
  playStoreUrl: "",                // filled when published
  privacyUrl: "",                  // filled when a policy is live
  status: "Status to be confirmed"
}
```

- Upload the changed `data/apps.js` — the Apps page, filters, home page and
  detail page update automatically.
- New **categories** are picked up automatically by the filter bar.
- Never invent ratings, downloads, reviews, user counts, revenue or other
  statistics — only publish what has been verified.

---

## 5. How to change Google Play URLs

- **Per app:** edit `playStoreUrl` for that app in `data/apps.js`.
  The "View on Google Play" button activates automatically once the field is
  filled with a valid `https://play.google.com/...` URL.
- **Studio developer page** (footer/contact/developer pages): edit
  `playStoreUrl` at the top of `data/site-config.js`.

When an app is actually live on Google Play, set its `status` to `Published`
so it also appears under "Published apps" on the Publisher page.

---

## 6. How to change contact information

Open **`data/site-config.js`**:

```js
email: "support@mtcorestudio.com",     // public support email
playStoreUrl: "https://play.google.com/store/apps/dev?id=...",
githubUrl: "https://github.com/...",
youtubeUrl: "https://youtube.com/...",
facebookUrl: "https://facebook.com/...",
xUrl: "https://x.com/...",
developerName: "Your name or studio name",
country: "Country",
```

Blank fields are simply hidden — the site never shows fake or broken links.
Never put passwords, advertising-account IDs, tax/payment information, API
keys or other private records in this file; every site file is public.

---

## 7. How to update the sitemap

On most hosts, all pages sit at the root, so the existing
**`sitemap.xml`** is already correct after replacing the domain (next point).

- If you add a brand-new HTML page later, add one `<url>` entry for it.
- Re-upload `sitemap.xml` and `robots.txt` together.
- Verify both after launch in Google Search Console.

---

## 8. How to connect a custom domain later

1. In InfinityFree → **Account** → **Domains**, click "Add a domain" and add
   the domain you own (e.g. `mtcorestudio.com`).
2. Point its DNS at InfinityFree's nameservers (shown in the control panel).
3. After propagation, do a **domain-wide find & replace** in these files:
   - `data/site-config.js` → `websiteUrl` and `canonicalDomain`
   - every `*.html` → the `rel="canonical"` URL and all
     `og:url` / `og:image` / `twitter:image` values
   - `robots.txt` → the `Sitemap:` line
   - `sitemap.xml` → the `https://example.com/...` URLs
   For example replace `https://example.com` with `https://mtcorestudio.com`.
4. Re-upload the updated files.

---

## 9. app-ads.txt - AdMob verification

`app-ads.txt` is already included at the site root with both publisher lines:

    google.com, pub-7383364741984927, DIRECT, f08c47fec0942fa0
    google.com, pub-1463796060515114, DIRECT, f08c47fec0942fa0

To finish AdMob verification:

1. Upload the file so it is reachable at the ROOT of the domain shown on each
   Google Play listing, e.g. https://yourdomain.com/app-ads.txt
2. The domain must match exactly what is set as the developer website on each
   store listing.
3. Wait at least 24 hours for Google to crawl it (it can take longer).
4. In AdMob go to Apps -> your app -> app-ads.txt and check the status. You
   can also open https://google.com/adsense/local-ads.txt to see crawled lines.
5. Need to add another publisher account later? Add one line per account and
   re-upload, or use the admin console (section 10).

This file is public by design - it exists exactly so anyone can verify which
advertising accounts are authorized to sell inventory for the apps.

## 10. Admin console - manage apps from the browser

Optional but recommended. It uses PHP, which InfinityFree includes free on
every account. The public pages themselves stay fully static and need no PHP.

Open: https://yourdomain.com/admin/

- First visit: create a password (stored only as a bcrypt hash; to reset, set
  $ADMIN_PASSWORD_HASH back to '' inside admin/config.php).
- Apps: add, edit, delete apps. Each save rewrites data/apps.js and is live
  on the public site immediately.
- "Google Play link or package ID": paste a Play Store URL or a package ID
  (e.g. com.example.app). It auto-fills name, package, category, description,
  downloads the icon into assets/apps/, and fills screenshots.
- Site settings: email, Google Play developer page, social links, developer
  name, country - writes data/site-config.js.
- app-ads.txt tab: edit the publisher lines directly and save.

Hardening: admin/config.php is denied to direct web access by .htaccess, the
password is hashed, and every write requires a CSRF token. For extra safety
remove the admin/ folder after making changes, protect it with a folder
password in your hosting panel, or keep a long password.

## 11. Set everything up in dash.infinityfree.com

1. Create a free account and choose "Create hosting account". Pick a free
   subdomain (for example mtcorestudio). You get a free Starter package with
   PHP and MySQL included.
2. Open the host in the control panel -> File Manager. Select all files and
   folders from THIS folder (the contents, not the wrapper folder) and upload
   them into public_html. FTP details are under "FTP details" in the panel
   if you prefer FileZilla.
3. Permissions are fine at the default values. PHP writes data/*.js,
   admin/config.php and app-ads.txt with the account's own permissions.
4. Check:
   - https://yourdomain.infinityfreeapp.com/ (the website)
   - https://yourdomain.infinityfreeapp.com/app-ads.txt (AdMob file)
5. Open https://yourdomain.infinityfreeapp.com/admin/ once and set the admin
   password.
6. Add your site to Google Search Console and submit sitemap.xml.
7. When ready for a custom domain: Account -> Domains -> Add a domain, point
   the nameservers InfinityFree shows you, then run the https://example.com
   find-and-replace described in section 8.

## 12. Features already built in

These ship with the current files - no extra setup needed beyond uploading:

- **Launch waitlist (per app).** Each app detail page shows a "Get notified"
  form while the app is unpublished. Submissions are stored by
  `api/waitlist.php` in `data/waitlist.js`. In the admin console under
  "Waitlist" you can review them and click **Export CSV** (opens in Excel /
  Sheets) or clear the list.
- **PWA (install as an app).** `site.webmanifest` + `sw.js` give phones a
  native-like install prompt and basic offline support. Bump the `CACHE`
  constant in `sw.js` after major redesigns (currently `mt-core-studio-v2` for
  the 2026 visual redesign — upload the new `sw.js` so returning visitors'
  browsers drop the old cached stylesheet).
- **Design system.** `css/style.css` is one theme-token file:

  - **Dark mode (default):** deep navy/black with electric-blue + cyan accents,
    subtle tech grid, soft neon glow, glass cards.
  - **Light mode (designed separately):** off-white `#f4f7fb` canvas, solid
    white surface cards with hairline borders and soft blue-tinted shadows,
    a faint dot-grid texture and WCAG-friendly ink colours. It is *not* simply
    dark mode inverted.
  - **Typography:** Space Grotesk (headings) + Inter (body) +
    JetBrains Mono (labels/code). The font `<link>` lives in every `.html`
    head — update there if you ever change the stack.
  - **Theme toggle:** a sliding sun/moon pill in the navbar; the choice is
    saved to `localStorage` (`mt-core-studio-theme`) and applied before paint
    to avoid a flash.
  - **Motion:** scroll-reveal uses `IntersectionObserver` (adds `data-reveal`
    elements), and both scroll reveal and all animations are disabled for
    users who set `prefers-reduced-motion`.
  - **Live design layer (CSS + a few lines of JS):** slowly drifting ambient
    aurora orbs, a rotating hero orbit, a breathing glow around the hero logo,
    gradient-shimmer headline accents, a one-time shine sweep across cards and
    buttons on hover, pulsing "live/brew" status dots, staggered scroll-reveal
    for card grids, a thin gradient scroll-progress bar along the top, and a
    soft gradient underline under the hero headline. All animation runs on
    `transform`/`opacity`/`background-position` so it stays smooth on phones,
    and the whole layer is disabled under `prefers-reduced-motion`. Orbs and
    the progress bar are injected by `setupLiveEffects()` in `js/main.js`.
- **RSS feed.** `feed.xml` is linked from the blog page. After editing
  `data/posts.js`, regenerate it with `node tools/generate-feed.mjs`. The feed
  reads the configured `websiteUrl` from `data/site-config.js` automatically.
- **Visitor statistics (admin → Visitors).** The site ships with a lightweight,
  privacy-friendly visit beacon (`api/visit.php`). Each page load records the
  page path, the date, and an approximate country code (from a client-side
  lookup by `js/main.js`). The private admin console shows **Today / Yesterday /
  Last 7 days / Last 30 days** plus a **top-countries breakdown**, and can export
  the anonymised log as CSV or clear it. No IP addresses, emails, names or
  cookies are stored; the log auto-trims to 120 days, and `data/visits.js` is
  blocked from direct download by the site root `.htaccess`.
- **Changelog / Updates page.** Add release entries to `data/changelog.js` to
  populate `updates.html` and the "What's new" block on each app page.
- **Verified statistics band (homepage).** Fill in `publishedStats` in
  `data/site-config.js` with numbers you can prove (Play Console), and the
  homepage shows them. It stays hidden until you add them - no invented figures.
- **Roadmap (About page).** Edit the `roadmap` list in `data/site-config.js`.
- **Per-app privacy pages.** `app-privacy.html?id=<app-id>` renders a policy
  template for each app (linked from the app detail page). Complete every
  section before the app ships - the template says it is in progress until then.
- **Breadcrumbs** on app detail and updates pages; dynamic `og:image` per app
  for social sharing.

## Privacy

`privacy.html` is a template that must be completed with each app's real data
practices before that app links to it. The Publisher page only lists apps
whose `status` is exactly `Published` with a verified store URL, and it never
claims verification badges or documents that are shared privately with
platform support.
