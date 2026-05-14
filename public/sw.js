const CACHE_VERSION = "yellowcollective-pwa-v1";
const PRECACHE_URLS = [
  "/offline.html",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/miniapp-icon.png",
  "/miniapp-splash.png",
  "/miniapp-embed.png",
  "/miniapp-hero.png",
  "/noggles.svg",
];

const DYNAMIC_PATH_PREFIXES = [
  "/api/",
  "/admin/",
  "/profile/",
  "/rounds/",
  "/vote/",
  "/create-proposal",
  "/community/submit",
  "/projects/submit",
  "/noundry",
  "/_next/image",
  "/_next/data",
  "/playground/yellow-collective/",
];

const STATIC_EXTENSIONS = [
  ".css",
  ".js",
  ".mjs",
  ".woff",
  ".woff2",
  ".ttf",
  ".ico",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

const isDynamicPath = (pathname) =>
  DYNAMIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const isStaticAsset = (pathname) =>
  pathname.startsWith("/_next/static/") ||
  STATIC_EXTENSIONS.some((extension) => pathname.endsWith(extension));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isDynamicPath(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;

          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
    );
  }
});
