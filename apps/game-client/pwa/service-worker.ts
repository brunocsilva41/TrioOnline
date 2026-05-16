/// <reference lib="webworker" />

/**
 * TRIO ONLINE - PWA Hardening Service Worker
 * Focus: AAA Resilience, Instant Load, Stale-While-Revalidate
 */

const CACHE_NAME = 'trio-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Extend the ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

/**
 * INSTALL EVENT: Pre-caching core assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * ACTIVATE EVENT: Cleanup old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/**
 * FETCH EVENT: Network Strategy - Stale-While-Revalidate
 * Optimized for cards, sounds, and UI assets.
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy: Stale-While-Revalidate for static assets (images, audio, fonts)
  const isStaticAsset = 
    request.destination === 'image' || 
    request.destination === 'audio' || 
    request.destination === 'font' ||
    url.pathname.includes('/cards/') ||
    url.pathname.includes('/audio/');

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Strategy: Network-First for everything else (HTML, JS, API)
  // to ensure the latest game logic while providing offline fallback.
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
      .then((response) => response || caches.match('/'))
  );
});

/**
 * Stale-While-Revalidate Implementation
 * Returns cached version immediately, then updates cache in background.
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || networkPromise;
}

/**
 * Background Sync / Push Notifications could be added here for "AAA" engagement
 */
 self.addEventListener('sync', (event: any) => {
   if (event.tag === 'sync-game-state') {
     console.log('[SW] Syncing game state...');
   }
 });
