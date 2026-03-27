// ══════════════════════════════════════════════
//  ERP System Pro - Service Worker
//  يوفر: Offline support + Background Sync + Cache
// ══════════════════════════════════════════════

const CACHE_NAME = "erp-pro-v1.0.0";
const STATIC_CACHE = "erp-static-v1";
const API_CACHE    = "erp-api-v1";

// الملفات اللي تتحمّل مسبقاً
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
];

// ══════════════════════════════════════════════
//  INSTALL - تحميل الكاش
// ══════════════════════════════════════════════
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ══════════════════════════════════════════════
//  ACTIVATE - تنظيف الكاش القديم
// ══════════════════════════════════════════════
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ══════════════════════════════════════════════
//  FETCH - استراتيجية الكاش
// ══════════════════════════════════════════════
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات غير HTTP
  if (!request.url.startsWith("http")) return;

  // API requests → Network First, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static files → Cache First
  event.respondWith(cacheFirst(request));
});

// Network First - للـ API
async function networkFirst(request) {
  try {
    const response = await fetch(request.clone());
    // كاش GET requests فقط
    if (request.method === "GET" && response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline - رجّع من الكاش
    const cached = await caches.match(request);
    if (cached) return cached;
    // لو مفيش كاش، رجّع error JSON
    return new Response(
      JSON.stringify({ message: "أنت غير متصل بالإنترنت", offline: true }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Cache First - للـ static files
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback → رجّع الـ index.html
    const fallback = await caches.match("/index.html");
    return fallback || new Response("غير متاح بدون إنترنت", { status: 503 });
  }
}

// ══════════════════════════════════════════════
//  BACKGROUND SYNC - مزامنة البيانات offline
// ══════════════════════════════════════════════
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending") {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  // هنا ممكن تضيف منطق مزامنة الطلبات المعلقة
  console.log("[SW] Syncing pending requests...");
}

// ══════════════════════════════════════════════
//  PUSH NOTIFICATIONS (مستقبلاً)
// ══════════════════════════════════════════════
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "ERP System Pro", {
    body: data.body || "لديك إشعار جديد",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    dir: "rtl",
    lang: "ar",
    data: data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
