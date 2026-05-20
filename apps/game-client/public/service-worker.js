const CACHE_NAME = "trio-assets-v2";
const CARD_ASSETS = [
  "/cards/card_1.webp",
  "/cards/card_2.webp",
  "/cards/card_3.webp",
  "/cards/card_4.webp",
  "/cards/card_5.webp",
  "/cards/card_6.webp",
  "/cards/card_7.webp",
  "/cards/card_8.webp",
  "/cards/card_9.webp",
  "/cards/card_10.webp",
  "/cards/card_11.webp",
  "/cards/card_12.webp",
  "/cards/trio_back_card.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CARD_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isCardAsset = url.pathname.startsWith("/cards/");

  if (!isCardAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
