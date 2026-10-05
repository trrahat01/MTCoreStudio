#!/usr/bin/env node
/**
 * MT Core Studio - renderer smoke test
 * ---------------------------------------------------------------------
 * Imports js/main.js with a minimal DOM shim and renders every page to
 * confirm no runtime errors and that the expected sections appear.
 * Not needed for hosting - purely a development helper.
 *
 * Run: node tools/test-render.mjs
 */

const elements = new Map();

function makeEl(extra) {
  const el = {
    innerHTML: "",
    dataset: {},
    hidden: false,
    title: "",
    textContent: "",
    className: "",
    value: "",
    checked: false,
    href: "",
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    addEventListener() {},
    appendChild() {},
    remove() {},
    click() {},
    focus() {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
  };
  return extra ? Object.assign(el, extra) : el;
}

global.document = {
  body: { dataset: { page: "home" } },
  documentElement: { dataset: { theme: "dark" } },
  title: "",
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeEl());
    return elements.get(id);
  },
  querySelector() { return makeEl(); },
  querySelectorAll() { return []; },
  addEventListener() {},
  createElement() { return makeEl(); },
};

global.window = {
  location: { href: "https://example.com/index.html", search: "" },
  innerWidth: 1024,
  addEventListener() {},
};

global.localStorage = { getItem() { return null; }, setItem() {} };
// navigator is a native global in Node 22+; main.js guards serviceWorker itself.
// rAF is used by the home page's decorative canvas/mouse-glow loops. Never
// invoke the callback (the loops self-schedule forever); just satisfy the call.
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => 0;

const cases = [
  { page: "home", search: "", checks: ["feature-band", "app-grid"], absent: ["stats-band"] },
  { page: "apps", search: "", checks: ["directory-tools", "app-search"] },
  { page: "app", search: "?id=daily-spark", checks: ["breadcrumbs", "waitlist-block", "LAUNCH NOTICE", "Daily Spark", "About this app"], absent: ["App not found"] },
  { page: "app", search: "?id=missing-app", checks: ["App not found"] },
  { page: "about", search: "", checks: ["roadmap-list", "Roadmap", "How an MT Core Studio app gets made"] },
  { page: "developer", search: "", checks: ["profile-card"] },
  { page: "publisher", search: "", checks: ["published", "PUBLISHER INFORMATION"] },
  { page: "contact", search: "", checks: ["GET IN TOUCH"] },
  { page: "privacy", search: "", checks: ["PRIVACY POLICY"] },
  { page: "blog", search: "", checks: ["Subscribe via RSS", "NOTES FROM THE STUDIO"] },
  { page: "updates", search: "", checks: ["UPDATES", "changelog-list"], absent: ["TypeError"] },
  { page: "app-privacy", search: "?id=daily-spark", checks: ["privacy, plainly", "breadcrumbs", "detail-copy policy"] },
];

let failures = 0;
for (const c of cases) {
  document.body.dataset.page = c.page;
  window.location.search = c.search;
  window.location.href = "https://example.com/" + (c.page === "app" || c.page === "app-privacy" ? c.page + ".html" : c.page + ".html") + c.search;

  try {
    await import(`../js/main.js?t=${Date.now()}&c=${c.page}${encodeURIComponent(c.search)}`);
    const main = elements.get("main-content");
    const html = main ? main.innerHTML : "";
    const ok = c.checks.every((token) => html.includes(token));
    const absentOk = (c.absent || []).every((token) => !html.includes(token));
    if (ok && absentOk) {
      console.log(`PASS ${c.page}${c.search} (${html.length} chars)`);
    } else {
      failures++;
      console.log(`FAIL ${c.page}${c.search}`);
      for (const token of c.checks) if (!html.includes(token)) console.log(`   missing: ${token}`);
      for (const token of c.absent || []) if (html.includes(token)) console.log(`   unexpected: ${token}`);
    }
  } catch (err) {
    failures++;
    console.log(`ERROR ${c.page}${c.search}: ${err.message}`);
  }
}

console.log(failures === 0 ? "\nALL RENDER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);