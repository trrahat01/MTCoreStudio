/* ---------------------------------------------------------------------------
 * MT Core Studio - service worker (progressive enhancement only)
 *
 * The website works perfectly without this file. The worker only adds an
 * install prompt (PWA) and offline support after the visitor has loaded the
 * site once.
 *
 * When you deploy a major update, bump CACHE to a new name (e.g. v2) so old
 * caches are replaced instead of lingering.
 * ------------------------------------------------------------------------- */

const CACHE = "mt-core-studio-v2";
const ROOT = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          ROOT,
          "./index.html",
          "./css/style.css",
          "./js/main.js",
          "./assets/images/mt-core-studio-logo.png",
          "./assets/images/favicon.svg",
        ])
      )
      .catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Data and the waitlist API change constantly - always try the network first.
  const isLiveData = url.pathname.includes("/data/") || url.pathname.includes("/api/");

  // Pages: network first, fall back to the cached copy, then to index.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => {
            if (hit) return hit;
            return caches.match(ROOT).then((root) => root || caches.match("./index.html"));
          })
        )
    );
    return;
  }

  // Everything else: cache first, then network and store the fresh copy.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((response) => {
            const copy = response.clone();
            if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => hit)
    )
  );
});