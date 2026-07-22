// Service Worker — Belle&Jolie Caisse
// Stratégie : "network-first" pour la page principale, afin que la caisse
// affiche toujours la dernière version déployée dès qu'il y a une connexion.
// Le cache ne sert que de secours en cas de coupure réseau (mode hors-ligne).

const CACHE_NAME = "bj-caisse-cache-v1"; // change ce numéro si tu ajoutes des fichiers à mettre en cache

self.addEventListener("install", (event) => {
  // Active la nouvelle version tout de suite, sans attendre la fermeture des onglets ouverts
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Supprime les anciens caches (versions précédentes du service worker)
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      // Prend le contrôle immédiat de toutes les pages déjà ouvertes
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // On ne gère que les requêtes GET (navigation / ressources de la page)
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // 1. Toujours essayer le réseau en premier → version la plus récente
        const networkResponse = await fetch(request);
        // On garde une copie fraîche en cache pour le mode hors-ligne
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
        // 2. Pas de réseau (hors-ligne) → on sert la dernière version connue en cache
        const cached = await caches.match(request);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
