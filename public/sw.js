/* DEMAX Studio service worker: makes the app open and work with no network.
 * Pages are network-first (fresh when online, cached copy when offline);
 * hashed build assets are cache-first. All user data is in IndexedDB, so
 * nothing here ever caches user content. */

const CACHE = "demax-shell-v2";
const PAGES = ["/", "/project", "/write", "/ideas", "/settings", "/codex", "/entity", "/timeline", "/graph", "/plot", "/ai"];
const EXTRA = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/icon.svg"];

async function precache() {
  const cache = await caches.open(CACHE);
  const assets = new Set(EXTRA);
  for (const page of PAGES) {
    try {
      const res = await fetch(page, { cache: "reload" });
      if (!res.ok) continue;
      const html = await res.clone().text();
      await cache.put(page, res);
      // Each page's HTML lists the JS/CSS/font chunks it needs.
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(m[0]);
    } catch {
      // Offline during install: the runtime cache fills in on later visits.
    }
  }
  await Promise.all(
    [...assets].map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {})),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

async function networkFirstPage(request, url) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    // Pages are keyed by path: /write?id=a and /write?id=b share one shell.
    if (res.ok) await cache.put(url.pathname, res.clone());
    return res;
  } catch {
    return (await cache.match(url.pathname)) || (await cache.match("/")) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) await cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await fresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url));
  } else if (isRscRequest(request, url)) {
    // Let the router fall back to a full navigation (served above) offline.
    return;
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
