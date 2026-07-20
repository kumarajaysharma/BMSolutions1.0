/* Forge Studio — service worker KILL-SWITCH (enterprise loading guarantee).
 *
 * Decision: for maximum loading reliability in every condition (embedded
 * iframes, corporate proxies, all browsers, all regions), NO service
 * worker may sit between the browser and the server. This worker exists
 * only to clean up after any previously installed version:
 *   1. Deletes every cache created by any earlier worker.
 *   2. Unregisters itself.
 *   3. Reloads open clients so they reconnect directly to the network.
 * After this runs once, clients have zero interception layer.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
      try {
        await self.registration.unregister();
      } catch {}
      try {
        const clientList = await self.clients.matchAll({ type: "window" });
        clientList.forEach((client) => client.navigate(client.url));
      } catch {}
    })()
  );
});

/* No fetch handler: the browser bypasses the worker entirely for all
 * requests, so there is no interception overhead and no cache risk. */
