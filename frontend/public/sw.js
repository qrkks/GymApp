const VERSION = "v2";
const SHELL_CACHE = `lift-log-shell-${VERSION}`;
const PRIVATE_CACHE = `lift-log-private-${VERSION}`;
const STATIC_PATHS = [
  "/offline.html",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(STATIC_PATHS))
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
            .filter(
              (key) =>
                key.startsWith("lift-log-") &&
                key !== SHELL_CACHE &&
                key !== PRIVATE_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isPrivatePath(pathname) {
  return (
    pathname.startsWith("/workouts") ||
    pathname.startsWith("/exercise-library") ||
    pathname.startsWith("/user")
  );
}

function normalizedRscRequest(request) {
  const url = new URL(request.url);
  url.searchParams.delete("_rsc");
  return new Request(url.toString(), {
    method: "GET",
    headers: request.headers,
    credentials: request.credentials,
    mode: "same-origin",
  });
}

async function networkFirst(request, cacheName, fallbackRequest = request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(fallbackRequest, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(fallbackRequest);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(
        request,
        isPrivatePath(url.pathname) ? PRIVATE_CACHE : SHELL_CACHE
      ).catch(async () => {
        const privateMatch = await caches.match(request, {
          cacheName: PRIVATE_CACHE,
        });
        return privateMatch || caches.match("/offline.html");
      })
    );
    return;
  }

  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    const cacheKey = normalizedRscRequest(request);
    event.respondWith(networkFirst(request, PRIVATE_CACHE, cacheKey));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(PRIVATE_CACHE));
  }
});
