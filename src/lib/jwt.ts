/**
 * JWT utility - Token decoding only.
 * All token GENERATION is handled server-side by the backend.
 * Client-side only needs to decode tokens for display/routing purposes.
 */

/**
 * Decode the payload of a JWT token (without verification).
 * Used only for reading claims like role, restaurant_id for UI routing.
 */
export function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired based on its `exp` claim.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp < Math.floor(Date.now() / 1000);
}
