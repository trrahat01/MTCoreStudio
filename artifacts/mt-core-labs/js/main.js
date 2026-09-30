import { apps } from "../data/apps.js";
import { posts } from "../data/posts.js";
import { siteConfig } from "../data/site-config.js";

const logo = "assets/images/mt-core-labs-logo.png";
const pageName = document.body.dataset.page || "home";
const categories = ["All", "Productivity", "Education", "Lifestyle", "Entertainment", "Tools", "Other"];

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const cleanUrl = (value = "") => {
  const input = String(value).trim();
  if (!input) return "";
  try {
    const parsed = new URL(input, window.location.href);
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? input : "";
  } catch { return ""; }
};
const isPublished = (app) => /^published$/i.test(app.status || "") && !!cleanUrl(app.playStoreUrl);
const monogram = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
const year = new Date().getFullYear();

function availableAction(label, url, primary = false) {
  const safe = cleanUrl(url);
  if (safe) return `<a class="button ${primary ? "button-primary" : "button-secondary"}" href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`;
  return `<button class="button button-secondary button-unavailable" type="button" disabled aria-disabled="true" title="Add the verified URL in data/site-config.js">${escapeHTML(label)} <span aria-hidden="true">↗</span></button>`;
}

function header() {
  const links = [
    ["Home", "index.html", "home"], ["Apps", "apps.html", "apps"],
    ["About", "about.html", "about"], ["Developer", "developer.html", "developer"],
    ["Publisher", "publisher.html", "publisher"], ["Blog", "blog.html", "blog"],
    ["Contact", "contact.html", "contact"]
  ];
  return `<a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="wrap nav-row">
        <a class="brand" href="index.html" aria-label="MT Core Labs home">
          <img src="${logo}" alt="MT Core Labs logo" width="44" height="44">
          <span class="brand-copy"><span class="brand-name">${escapeHTML(siteConfig.brandName)}</span><span class="brand-tag">${escapeHTML(siteConfig.tagline)}</span></span>
        </a>
        <nav class="nav-links" id="primary-navigation" aria-label="Main navigation">
          ${links.map(([label, href, key]) => `<a href="${href}"${pageName === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        </nav>
        <div class="nav-actions">
          <button class="theme-toggle" type="button" id="theme-toggle" aria-label="Switch to light mode" title="Switch theme"></button>
          <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="primary-navigation"><span aria-hidden="true">☰</span></button>
        </div>
      </div>
    </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="wrap footer-main">
      <div class="footer-brand">
        <img src="${logo}" alt="MT Core Labs logo" width="66" height="66" loading="lazy">
        <div class="brand-name">${escapeHTML(siteConfig.brandName)}</div>
        <p>${escapeHTML(siteConfig.tagline)}</p>
        <p>An independent Android app development brand focused on useful, everyday software.</p>
      </div>
      <div class="footer-col"><h3>Explore</h3><div class="footer-links">
        <a href="index.html">Home</a><a href="apps.html">Apps</a><a href="about.html">About</a>
        <a href="developer.html">Developer</a><a href="publisher.html">Publisher</a><a href="blog.html">Blog</a>
      </div></div>
      <div class="footer-col"><h3>Information</h3><div class="footer-links">
        <a href="privacy.html">Privacy template</a><a href="contact.html">Contact</a>
        ${cleanUrl(siteConfig.githubUrl) ? `<a href="${escapeHTML(cleanUrl(siteConfig.githubUrl))}" target="_blank" rel="noopener noreferrer">GitHub</a>` : `<span>GitHub · not configured</span>`}
        ${cleanUrl(siteConfig.youtubeUrl) ? `<a href="${escapeHTML(cleanUrl(siteConfig.youtubeUrl))}" target="_blank" rel="noopener noreferrer">YouTube</a>` : `<span>YouTube · not configured</span>`}
        ${cleanUrl(siteConfig.facebookUrl) ? `<a href="${escapeHTML(cleanUrl(siteConfig.facebookUrl))}" target="_blank" rel="noopener noreferrer">Facebook</a>` : `<span>Facebook · not configured</span>`}
        ${cleanUrl(siteConfig.playStoreUrl) ? `<a href="${escapeHTML(cleanUrl(siteConfig.playStoreUrl))}" target="_blank" rel="noopener noreferrer">Google Play profile</a>` : `<span>Google Play · not configured</span>`}
      </div></div>
    </div>
    <div class="wrap footer-bottom"><span>© ${year} ${escapeHTML(siteConfig.brandName)}. All rights reserved.</span><span>BUILD · INNOVATE · SIMPLIFY</span></div>
  </footer>`;
}

function appCard(app) {
  return `<article class="app-card">
    <div class="app-card-top"><div class="app-monogram" aria-label="Initials ${escapeHTML(monogram(app.name))}">${escapeHTML(monogram(app.name))}</div><span class="category-pill">${escapeHTML(app.category)}</span></div>
    <h3>${escapeHTML(app.name)}</h3><p>${escapeHTML(app.description || "App description to be added.")}</p>
    <div class="app-card-bottom"><span class="status-pill">${escapeHTML(app.status || "Status to be confirmed")}</span><a class="card-link" href="app.html?id=${encodeURIComponent(app.id)}">App details <span aria-hidden="true">→</span></a></div>
  </article>`;
}

function homePage() {
  return `<section class="hero"><div class="wrap hero-grid">
    <div class="reveal">
      <span class="eyebrow">WELCOME TO MT CORE LABS</span>
      <h1>Smart Apps for a <span>Better Tomorrow</span></h1>
      <p class="hero-copy">MT Core Labs creates useful, simple and powerful mobile applications designed to solve everyday problems and make digital life easier.</p>
      <div class="hero-actions"><a class="button button-primary" href="apps.html">Explore Apps <span aria-hidden="true">→</span></a>${availableAction("View on Google Play", siteConfig.playStoreUrl)}</div>
    </div>
    <div class="hero-visual reveal reveal-delay" aria-label="MT Core Labs brand artwork">
      <div class="hero-orbit" aria-hidden="true"></div>
      <div class="hero-logo-frame"><img src="${logo}" alt="Original MT Core Labs logo, featuring a blue and cyan MT mark" width="1024" height="1024" fetchpriority="high"></div>
      <div class="visual-tag"><b>INDEPENDENT / ANDROID</b><span>Useful software, built with care.</span></div>
    </div>
  </div></section>
  <section class="feature-band" aria-label="Our product principles"><div class="wrap feature-row">
    ${["Modern UI/UX", "Useful Applications", "Play Store Ready", "Fast & Lightweight"].map((label, i) => `<div class="feature"><span class="feature-mark" aria-hidden="true">${["01", "02", "03", "04"][i]}</span><span>${label}</span></div>`).join("")}
  </div></section>
  <section class="section"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">A SMALL, GROWING COLLECTION</span><h2>Apps for real routines.</h2><p>A selection of app records maintained by MT Core Labs. Listing details are placeholders until confirmed.</p></div><a class="text-link" href="apps.html">Browse all apps <span aria-hidden="true">→</span></a></div>
    <div class="app-grid">${apps.slice(0, 3).map(appCard).join("")}</div>
  </div></section>
  <section class="section practice-section"><div class="wrap practice-layout">
    <div class="practice-intro"><span class="eyebrow">A SIMPLE WORKING METHOD</span><h2>Make useful<br>things. Make them<br>make sense.</h2><p>Good software respects the person using it. We keep the intent close and the experience clear.</p></div>
    <div class="practice-list">
      <article class="practice-step"><span>01</span><div><h3>Start with a real need</h3><p>Look for a familiar task where a thoughtful tool can make the day a little easier.</p></div><b aria-hidden="true">↗</b></article>
      <article class="practice-step"><span>02</span><div><h3>Build with care</h3><p>Shape the idea into an Android app with considered details and a clear interface.</p></div><b aria-hidden="true">↗</b></article>
      <article class="practice-step"><span>03</span><div><h3>Keep simplifying</h3><p>Refine the experience so the useful part stays easy to find and easy to use.</p></div><b aria-hidden="true">↗</b></article>
    </div>
  </div></section>
  <section class="section-tight"><div class="wrap"><div class="studio-note">
    <div class="studio-stamp"><img src="${logo}" alt="" width="72" height="72" loading="lazy"><span>INDEPENDENT<br>BY DESIGN</span></div>
    <div><span class="eyebrow">A PERSONAL SCALE, A PRACTICAL FOCUS</span><h2>Small enough to stay close to the problem.</h2><p>MT Core Labs is an independent Android app development brand—not a platform or a promise of scale. The work is about making useful things, one clear experience at a time.</p></div>
    <a class="text-link" href="about.html">More about MT Core Labs <span aria-hidden="true">→</span></a>
  </div></div></section>
  <section class="section-tight"><div class="wrap"><div class="callout"><div class="callout-content">
    <span class="eyebrow">BUILD · INNOVATE · SIMPLIFY</span><h2>Thoughtful tools.<br>Less friction in the day.</h2>
    <p>MT Core Labs is an independent Android app development brand. The aim is straightforward: build useful products, improve them carefully, and keep everyday experiences simple.</p>
    <a href="about.html" class="button button-secondary">Get to know the studio <span aria-hidden="true">→</span></a>
  </div></div></div></section>`;
}

function appsPage() {
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">APPLICATION DIRECTORY</span><h1>Useful apps, clearly listed.</h1><p>Explore the current MT Core Labs app records. Use category filters or search by app name and category. App publication status is shown as provided.</p></div></section>
  <section class="content-section"><div class="wrap">
    <div class="directory-tools">
      <label class="search-wrap"><span aria-hidden="true">⌕</span><span class="sr-only">Search apps by name or category</span><input class="search-input" id="app-search" type="search" placeholder="Search app name or category" autocomplete="off"></label>
      <div class="filter-row" role="group" aria-label="Filter apps by category">${categories.map((name, index) => `<button class="filter-button" type="button" data-filter="${escapeHTML(name)}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHTML(name)}</button>`).join("")}</div>
    </div>
    <p class="result-count" id="result-count" aria-live="polite"></p>
    <div class="app-grid" id="apps-grid">${apps.map(appCard).join("")}</div>
    <div class="empty-state" id="apps-empty" hidden><strong>No apps match that search.</strong>Try a different name or choose another category.</div>
  </div></section>`;
}

function detailPage() {
  const id = new URLSearchParams(window.location.search).get("id");
  const app = apps.find((item) => item.id === id);
  if (!app) return `<section class="page-intro"><div class="wrap"><span class="eyebrow">APP DETAILS</span><h1>App not found.</h1><p>That app record is not available. Browse the directory to see the current collection.</p><div class="hero-actions"><a class="button button-primary" href="apps.html">Explore apps</a></div></div></section>`;
  document.title = `${app.name} | MT Core Labs`;
  const description = `${app.name} — ${app.category} app by MT Core Labs. ${app.description}`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${app.name} | MT Core Labs`);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  const siteRoot = siteConfig.canonicalDomain.replace(/\/+$/, "");
  const detailUrl = `${siteRoot}/app.html?id=${encodeURIComponent(app.id)}`;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = detailUrl;
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", detailUrl);
  return `<section class="content-section"><div class="wrap detail-layout">
    <aside class="detail-aside"><div class="detail-icon" aria-label="Initials ${escapeHTML(monogram(app.name))}">${escapeHTML(monogram(app.name))}</div>
      <h1>${escapeHTML(app.name)}</h1><p class="detail-copy">${escapeHTML(app.description || "App description to be added.")}</p>
      <div class="hero-actions">${availableAction("View on Google Play", app.playStoreUrl, true)}</div>
      <div class="detail-meta">
        <div class="meta-row"><span>Category</span><span>${escapeHTML(app.category)}</span></div>
        <div class="meta-row"><span>Platform</span><span>${escapeHTML(app.platform || "Android")}</span></div>
        <div class="meta-row"><span>Status</span><span>${escapeHTML(app.status || "Status to be confirmed")}</span></div>
        <div class="meta-row"><span>Package name</span><span>${escapeHTML(app.packageName || "Not provided")}</span></div>
      </div>
    </aside>
    <div class="detail-copy">
      <section><h2>About this app</h2><p>${escapeHTML(app.description || "App description to be added.")}</p><div class="placeholder-note">This listing is a content placeholder. Add verified app information to <code>data/apps.js</code> before presenting it as published.</div></section>
      <section><h2>Features</h2>${app.features?.length ? `<ul class="privacy-list">${app.features.map((feature) => `<li>${escapeHTML(feature)}</li>`).join("")}</ul>` : `<p>Feature details have not been provided yet.</p>`}</section>
      <section><h2>Screenshots</h2><p>App screenshots have not been supplied.</p></section>
      <section><h2>Privacy & support</h2><p>Privacy information must reflect the actual data practices of this app. Review and complete the <a class="text-link" href="privacy.html">privacy policy template</a> before linking a policy.</p>
        ${app.privacyUrl && cleanUrl(app.privacyUrl) ? `<a class="text-link" href="${escapeHTML(cleanUrl(app.privacyUrl))}">App privacy policy →</a>` : `<p>No app-specific privacy policy link has been configured.</p>`}
        <p>For support, visit the <a class="text-link" href="contact.html">contact page</a>.</p></section>
    </div>
  </div></section>`;
}

function aboutPage() {
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">ABOUT MT CORE LABS</span><h1>Independent by nature.<br>Useful by design.</h1><p>MT Core Labs is an independent app-development brand making Android apps intended to simplify everyday life.</p></div></section>
  <section class="content-section"><div class="wrap">
    <div class="info-grid">
      <article class="info-panel"><span class="number">01 / WHO WE ARE</span><h2>Who We Are</h2><p>MT Core Labs is an independent Android app development brand. We work on practical software ideas with a focus on usefulness, clarity and care in the details.</p></article>
      <article class="info-panel"><span class="number">02 / WHAT WE BUILD</span><h2>What We Build</h2><p>We create mobile applications across different categories. Each product begins with a simple question: can this make a familiar task easier to handle?</p></article>
      <article class="info-panel"><span class="number">03 / OUR PHILOSOPHY</span><h2>Our Philosophy</h2><p>BUILD useful products. INNOVATE by improving ideas with modern technology. SIMPLIFY by making apps easier to understand and use.</p></article>
      <article class="info-panel"><span class="number">04 / WHY MT CORE LABS</span><h2>Why MT Core Labs</h2><p>A small independent studio can stay close to the problem. Our focus is on considered features, approachable interfaces and continuous improvement.</p></article>
    </div>
    <div class="principles" style="margin-top:46px"><div><span class="eyebrow">THE NAME SAYS IT SIMPLY</span><h2 style="font-size:clamp(30px,4vw,46px);line-height:1.1;letter-spacing:-.055em">Three ideas.<br>One working practice.</h2></div>
      <div class="principle-list"><div class="principle"><b>BUILD</b><p>Create useful products that answer everyday needs.</p></div><div class="principle"><b>INNOVATE</b><p>Improve good ideas with thoughtful use of modern technology.</p></div><div class="principle"><b>SIMPLIFY</b><p>Make apps easier for everyday users to navigate and understand.</p></div></div>
    </div>
  </div></section>`;
}

function developerPage() {
  const configured = (label, value) => cleanUrl(value)
    ? `<a class="profile-link" href="${escapeHTML(cleanUrl(value))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
    : `<span class="profile-link" aria-disabled="true">${label} · not configured</span>`;
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">DEVELOPER PROFILE</span><h1>A small studio, building for mobile.</h1><p>Public developer information for MT Core Labs. Details not provided are left unlisted rather than guessed.</p></div></section>
  <section class="content-section"><div class="wrap">
    <article class="profile-card">
      <div class="profile-heading"><img src="${logo}" alt="MT Core Labs logo" width="76" height="76" loading="lazy"><div><h2>${escapeHTML(siteConfig.brandName)}</h2><p>${escapeHTML(siteConfig.developerRole || "Independent App Developer / Software Studio")}</p></div></div>
      <div class="detail-meta" style="margin:0 0 24px">
        <div class="meta-row"><span>Developer name</span><span>${escapeHTML(siteConfig.developerName || "Not provided")}</span></div>
        <div class="meta-row"><span>Country</span><span>${escapeHTML(siteConfig.country || "Not provided")}</span></div>
        <div class="meta-row"><span>Website</span><span>${escapeHTML(siteConfig.websiteUrl || "Not provided")}</span></div>
      </div>
      <div class="profile-links">
        ${siteConfig.email ? `<a class="profile-link" href="mailto:${escapeHTML(siteConfig.email)}">Email MT Core Labs ↗</a>` : `<span class="profile-link" aria-disabled="true">Email · not configured</span>`}
        ${configured("Google Play developer page", siteConfig.playStoreUrl)}
        ${configured("GitHub", siteConfig.githubUrl)}${configured("YouTube", siteConfig.youtubeUrl)}${configured("Facebook", siteConfig.facebookUrl)}
      </div>
    </article>
    <div class="notice" style="margin-top:18px"><strong>About this profile</strong><br>Public links are read from <code>data/site-config.js</code>. Configure only verified details you intend to publish.</div>
  </div></section>`;
}

function publisherPage() {
  const published = apps.filter(isPublished);
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">PUBLIC TRANSPARENCY</span><h1>Publisher information.</h1><p>Publicly shareable publisher details for MT Core Labs. Only information intentionally configured for publication appears here.</p></div></section>
  <section class="content-section"><div class="wrap">
    <article class="profile-card">
      <div class="profile-heading"><img src="${logo}" alt="MT Core Labs logo" width="76" height="76" loading="lazy"><div><h2>Publisher</h2><p>${escapeHTML(siteConfig.brandName)}</p></div></div>
      <div class="detail-meta">
        <div class="meta-row"><span>Publisher</span><span>${escapeHTML(siteConfig.brandName)}</span></div>
        <div class="meta-row"><span>Developer</span><span>${escapeHTML(siteConfig.developerName || "Not provided")}</span></div>
        <div class="meta-row"><span>Country</span><span>${escapeHTML(siteConfig.country || "Not provided")}</span></div>
        <div class="meta-row"><span>Support email</span><span>${siteConfig.email ? `<a href="mailto:${escapeHTML(siteConfig.email)}">${escapeHTML(siteConfig.email)}</a>` : "Not configured"}</span></div>
        <div class="meta-row"><span>Developer page</span><span>${cleanUrl(siteConfig.playStoreUrl) ? `<a href="${escapeHTML(cleanUrl(siteConfig.playStoreUrl))}" target="_blank" rel="noopener noreferrer">Google Play ↗</a>` : "Not configured"}</span></div>
      </div>
    </article>
    <div style="margin-top:39px"><div class="section-head"><div><span class="eyebrow">APP RECORDS</span><h2>Apps</h2><p>Only apps marked Published with a configured official store URL appear as published.</p></div></div>
      ${published.length ? `<div class="app-grid">${published.map((app) => `<article class="app-card"><span class="category-pill" style="align-self:flex-start">${escapeHTML(app.category)}</span><h3>${escapeHTML(app.name)}</h3><p>${escapeHTML(app.description)}</p><div class="app-card-bottom"><span class="status-pill">Published</span><a class="card-link" href="${escapeHTML(cleanUrl(app.playStoreUrl))}" target="_blank" rel="noopener noreferrer">Official listing ↗</a></div></article>`).join("")}</div>` : `<div class="empty-state"><strong>No apps are currently confirmed as published.</strong>Update an app record with verified publication details before listing it here.</div>`}
    </div>
    <div class="notice" style="margin-top:24px"><strong>Public information only.</strong><br>Private advertising-account, login, tax, payment and other sensitive publisher records do not belong in public website files. This static site has no private admin area.</div>
  </div></section>`;
}

function contactPage() {
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">CONTACT</span><h1>Start with a clear note.</h1><p>For questions about MT Core Labs or its apps, use a configured public contact channel below.</p></div></section>
  <section class="content-section"><div class="wrap">
    <div class="callout"><div class="callout-content"><span class="eyebrow">GET IN TOUCH</span><h2>We’re listening.</h2><p>Email and official profile links appear here once added to the public site configuration.</p>
      <div class="profile-links">
        ${siteConfig.email ? `<a class="button button-primary" href="mailto:${escapeHTML(siteConfig.email)}">Email MT Core Labs <span aria-hidden="true">↗</span></a>` : `<button class="button button-secondary button-unavailable" type="button" disabled aria-disabled="true" title="Add a public support email to data/site-config.js">Email · not configured</button>`}
        ${cleanUrl(siteConfig.playStoreUrl) ? `<a class="button button-secondary" href="${escapeHTML(cleanUrl(siteConfig.playStoreUrl))}" target="_blank" rel="noopener noreferrer">Google Play developer page ↗</a>` : `<span class="profile-link" aria-disabled="true">Google Play · not configured</span>`}
        ${cleanUrl(siteConfig.githubUrl) ? `<a class="button button-secondary" href="${escapeHTML(cleanUrl(siteConfig.githubUrl))}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : `<span class="profile-link" aria-disabled="true">GitHub · not configured</span>`}
        ${cleanUrl(siteConfig.youtubeUrl) ? `<a class="button button-secondary" href="${escapeHTML(cleanUrl(siteConfig.youtubeUrl))}" target="_blank" rel="noopener noreferrer">YouTube ↗</a>` : `<span class="profile-link" aria-disabled="true">YouTube · not configured</span>`}
        ${cleanUrl(siteConfig.facebookUrl) ? `<a class="button button-secondary" href="${escapeHTML(cleanUrl(siteConfig.facebookUrl))}" target="_blank" rel="noopener noreferrer">Facebook ↗</a>` : `<span class="profile-link" aria-disabled="true">Facebook · not configured</span>`}
      </div>
    </div></div>
    <p class="detail-copy" style="margin-top:18px">No contact form is used. Configure public details in <code>data/site-config.js</code> when ready.</p>
  </div></section>`;
}

function privacyPage() {
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">PRIVACY POLICY TEMPLATE</span><h1>Complete this before publishing.</h1><p>This is an uncompleted template, not an active privacy policy. It makes no claim about the data practices of MT Core Labs apps.</p></div></section>
  <section class="content-section"><div class="wrap">
    <div class="notice"><strong>Action required:</strong> Replace this template with accurate, app-specific disclosures after reviewing the actual app, SDKs, services, permissions and data flows. Do not publish until it has been completed and reviewed.</div>
    <article class="detail-copy" style="max-width:780px;margin-top:34px">
      <section><h2>Policy owner & contact</h2><p>[Add the legal publisher/developer name, app name, effective date, and a monitored privacy contact address.]</p></section>
      <section><h2>Information and purposes</h2><p>[Describe each category of personal or device information the app handles, whether collected directly or by third parties, why it is used, and whether providing it is optional or required. If a category is not involved, confirm that against the actual app before stating so.]</p></section>
      <section><h2>Sharing and service providers</h2><p>[Identify recipients, SDKs, analytics, advertising or infrastructure providers and their roles. Explain when information is shared and link to their current policies.]</p></section>
      <section><h2>Retention, security and location</h2><p>[Explain retention periods or criteria, security practices in accurate general terms, and any cross-border handling that applies.]</p></section>
      <section><h2>Choices, children and rights</h2><p>[Add the controls, deletion/rights request process, applicable age information, and jurisdiction-specific disclosures relevant to this app.]</p></section>
      <section><h2>Changes & app-specific details</h2><p>[Describe how policy updates are communicated and provide version history. Use a separate completed policy for each app where their practices differ.]</p><p>Review the requirements of each distribution platform and applicable law before publishing.</p></section>
    </article>
  </div></section>`;
}

function blogPage() {
  if (!posts.length) return `<section class="page-intro"><div class="wrap"><span class="eyebrow">NOTES FROM THE STUDIO</span><h1>Ideas in progress.</h1><p>News, product notes and practical thoughts from MT Core Labs—added by hand when there is something worth sharing.</p></div></section>
    <section class="content-section"><div class="wrap"><div class="empty-state"><strong>No posts yet.</strong>New writing will appear here as it is added to <code>data/posts.js</code>.</div></div></section>`;
  return `<section class="page-intro"><div class="wrap"><span class="eyebrow">NOTES FROM THE STUDIO</span><h1>Ideas in progress.</h1><p>News, product notes and practical thoughts from MT Core Labs.</p></div></section>
    <section class="content-section"><div class="wrap"><div class="post-list">${posts.map((post) => `<article class="post-card">
      ${post.image ? `<img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.imageAlt || post.title)}" loading="lazy">` : `<div class="post-date">${escapeHTML(post.date || "Date to be added")}</div>`}
      <div><span class="post-date">${escapeHTML(post.category || "Studio note")}${post.image ? ` · ${escapeHTML(post.date || "Date to be added")}` : ""}</span><h2>${escapeHTML(post.title || "Untitled post")}</h2><p>${escapeHTML(post.description || "")}</p>${post.content ? `<p style="margin-top:12px">${escapeHTML(post.content)}</p>` : ""}</div>
    </article>`).join("")}</div></div></section>`;
}

const renderers = {
  home: homePage, apps: appsPage, app: detailPage, about: aboutPage,
  developer: developerPage, publisher: publisherPage, contact: contactPage,
  privacy: privacyPage, blog: blogPage
};

function setupTheme() {
  const button = document.getElementById("theme-toggle");
  let theme = "dark";
  try { theme = localStorage.getItem("mt-core-labs-theme") || "dark"; } catch { /* storage may be disabled */ }
  if (theme !== "light") theme = "dark";
  document.body.dataset.theme = theme;
  const update = () => {
    const isDark = document.body.dataset.theme !== "light";
    button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    button.innerHTML = isDark
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.7" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.3 15.2A8.4 8.4 0 0 1 8.8 3.7 8.5 8.5 0 1 0 20.3 15.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
  };
  update();
  button.addEventListener("click", () => {
    document.body.dataset.theme = document.body.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("mt-core-labs-theme", document.body.dataset.theme); } catch { /* preference remains for this page view */ }
    update();
  });
}

function setupNavigation() {
  const button = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-navigation");
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation menu");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
  });
}

function setupDirectory() {
  if (pageName !== "apps") return;
  const input = document.getElementById("app-search");
  const buttons = [...document.querySelectorAll("[data-filter]")];
  const grid = document.getElementById("apps-grid");
  const empty = document.getElementById("apps-empty");
  const count = document.getElementById("result-count");
  let filter = "All";
  const draw = () => {
    const query = input.value.trim().toLowerCase();
    const visible = apps.filter((app) => (filter === "All" || app.category === filter) &&
      `${app.name} ${app.category}`.toLowerCase().includes(query));
    grid.innerHTML = visible.map(appCard).join("");
    empty.hidden = visible.length > 0;
    count.textContent = `${visible.length} ${visible.length === 1 ? "app" : "apps"} shown`;
  };
  buttons.forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.filter;
    buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    draw();
  }));
  input.addEventListener("input", draw);
  draw();
}

document.getElementById("site-header").innerHTML = header();
document.getElementById("main-content").innerHTML = (renderers[pageName] || homePage)();
document.getElementById("site-footer").innerHTML = footer();
setupTheme();
setupNavigation();
setupDirectory();