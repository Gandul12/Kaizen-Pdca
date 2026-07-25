/**
 * Simple in-memory rate limiter using a Map.
 *
 * Each "bucket" is keyed by `${namespace}:${ip}` and tracks how many
 * FAILED attempts have happened inside a rolling window.
 *
 * - Only failed attempts increment the counter (call `recordFailure`).
 * - A successful attempt resets the counter (call `recordSuccess`).
 * - `isBlocked` returns whether the IP has hit the limit.
 *
 * Stale entries are lazily garbage-collected on every `isBlocked` call
 * so the Map never grows unboundedly.
 */

interface BucketEntry {
  /** Timestamps (ms) of each failed attempt still inside the window. */
  failures: number[];
}

const store = new Map<string, BucketEntry>();

// Garbage-collect entries older than 30 minutes on every Nth call.
let gcCounter = 0;
const GC_EVERY = 50; // run GC every 50 calls

function gcStaleEntries(windowMs: number) {
  const cutoff = Date.now() - windowMs * 2; // keep a 2× buffer so we don't GC too aggressively
  for (const [key, entry] of store) {
    if (entry.failures.length === 0 || entry.failures[entry.failures.length - 1] < cutoff) {
      store.delete(key);
    }
  }
}

function getKey(namespace: string, ip: string): string {
  return `${namespace}::${ip}`;
}

function pruneWindow(entry: BucketEntry, windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  // failures are appended chronologically; drop old ones from the front.
  while (entry.failures.length > 0 && entry.failures[0] < cutoff) {
    entry.failures.shift();
  }
}

/**
 * Check whether this IP is blocked for the given namespace.
 * Returns `{ blocked: false }` or `{ blocked: true, retryAfterSeconds }`.
 */
export function isBlocked(
  namespace: string,
  ip: string,
  maxAttempts: number,
  windowMs: number
): { blocked: false } | { blocked: true; retryAfterSeconds: number } {
  // Lazy GC
  gcCounter++;
  if (gcCounter >= GC_EVERY) {
    gcCounter = 0;
    gcStaleEntries(windowMs);
  }

  const key = getKey(namespace, ip);
  const entry = store.get(key);
  if (!entry) return { blocked: false };

  pruneWindow(entry, windowMs);

  if (entry.failures.length >= maxAttempts) {
    // Oldest failure still in window determines when the window expires.
    const oldestInWindow = entry.failures[0];
    const expiresAt = oldestInWindow + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
    return { blocked: true, retryAfterSeconds };
  }

  return { blocked: false };
}

/**
 * Record a failed password attempt for this IP.
 */
export function recordFailure(namespace: string, ip: string): void {
  const key = getKey(namespace, ip);
  let entry = store.get(key);
  if (!entry) {
    entry = { failures: [] };
    store.set(key, entry);
  }
  entry.failures.push(Date.now());
}

/**
 * Reset the failure counter for this IP (called on successful auth).
 */
export function recordSuccess(namespace: string, ip: string): void {
  const key = getKey(namespace, ip);
  store.delete(key);
}
