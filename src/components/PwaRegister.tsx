"use client";

import { useEffect } from "react";

/**
 * Loading-reliability guarantee: actively REMOVE any service worker and
 * cache layer from every client.
 *
 * Earlier releases shipped workers that cached pages/chunks; a client
 * holding one could load stale bundles or route requests through an
 * interception hop — the "slow / doesn't load" failure class. This
 * bootstrap unregisters every worker and deletes every cache so the
 * browser always talks directly to the server. The installable PWA
 * manifest remains, so "Add to Home Screen" still works — just with
 * zero interception layer.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {}
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {}
    })();
  }, []);
  return null;
}
