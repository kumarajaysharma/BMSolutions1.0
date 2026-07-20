// ── Server-side micro-cache ────────────────────────────────────────
// Read-heavy dashboard endpoints are polled by multiple clients.
// A tiny TTL cache absorbs that fan-out so the database sees one
// query per window instead of one per client per poll.

type Entry = { expires: number; value: unknown };

const globalForCache = globalThis as typeof globalThis & {
  __forgeServerCache?: Map<string, Entry>;
};

const store = (globalForCache.__forgeServerCache ??= new Map<string, Entry>());

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await fn();
  store.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
