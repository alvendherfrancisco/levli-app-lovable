// Levli Service Worker — offline shell caching only.
//
// Caching strategy:
//   * navigations  → network first, falling back to the cached app shell so an
//                    installed Levli opens with no connection.
//   * static assets → cache first (they are build-hashed), refreshed in the
//                    background.
//   * requests to other origins (fonts, CDN scripts) → left to the network, so
//     nothing private is ever written into the cache.

const SHELL_CACHE = "levli-shell-v2";
const ASSET_CACHE = "levli-assets-v2";
const ICON = "/assets/brand/levli-icon-192.png?v=2";
const SHELL_FILES = ["/", "/index.html", "/manifest.json", ICON];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only same-origin GETs are cached; API calls and auth always hit the network.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/functions")) return;

  // App shell for page navigations.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match("/index.html").then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Static assets: cache first, then refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy)).catch(() => null);
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
