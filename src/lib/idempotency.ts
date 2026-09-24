/**
 * Generates and manages Idempotency keys (UUIDv4) for state-changing or money-moving operations.
 * Reuses key across retries of the same client action until cleared.
 */

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const keyCache = new Map<string, string>();

export function getOrCreateActionIdempotencyKey(actionKey: string): string {
  if (!keyCache.has(actionKey)) {
    keyCache.set(actionKey, generateUUID());
  }
  return keyCache.get(actionKey)!;
}

export function clearActionIdempotencyKey(actionKey: string): void {
  keyCache.delete(actionKey);
}
