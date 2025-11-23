self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Optional: basic fetch handler (currently pass-through)
self.addEventListener("fetch", () => {
  // You can add caching logic here later if needed.
});
