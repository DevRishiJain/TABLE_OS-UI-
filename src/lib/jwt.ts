/**
 * Client-side JWT utility for Demo Quick-Fill authentication.
 * Uses standard Web Crypto API (HMAC-SHA256) matching the backend Go implementation.
 */

const DEFAULT_JWT_SECRET =
  process.env.NEXT_PUBLIC_JWT_SECRET || "super-secure-dining-os-jwt-secret-key-32b";

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlEncodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function generateClientJWT(
  payload: Record<string, unknown>,
  secret: string = DEFAULT_JWT_SECRET
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const encodedSignature = base64UrlEncodeBuffer(signature);

  return `${data}.${encodedSignature}`;
}

export interface DemoProfile {
  name: string;
  roleDescription: string;
  badge: string;
  getPayload: () => Record<string, unknown>;
}

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  admin: {
    name: "Vikram Mehta (Restaurant Admin)",
    roleDescription: "Full access to The Spice Route menu, staff, settings & ledger",
    badge: "Admin",
    getPayload: () => ({
      staff_id: "13f46eec-85ab-4b2c-bb7d-ae462f819952",
      restaurant_id: "b1000000-0000-0000-0000-000000000001",
      role: "RESTAURANT_ADMIN",
      is_platform: false,
      sub: "13f46eec-85ab-4b2c-bb7d-ae462f819952",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    }),
  },
  waiter: {
    name: "Rohan Verma (Floor Waiter)",
    roleDescription: "Floor grid, first-order OTP verification & order acceptance",
    badge: "Floor Staff",
    getPayload: () => ({
      staff_id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
      restaurant_id: "b1000000-0000-0000-0000-000000000001",
      role: "WAITER",
      is_platform: false,
      sub: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    }),
  },
  kitchen: {
    name: "Chef Anita Desai (Head Chef)",
    roleDescription: "KDS Queue Kanban: Cooking stage updates (Preparing -> Ready -> Served)",
    badge: "Kitchen Chef",
    getPayload: () => ({
      staff_id: "f1e2d3c4-b5a6-4f7e-8d9c-0b1a2f3e4d5c",
      restaurant_id: "b1000000-0000-0000-0000-000000000001",
      role: "KITCHEN",
      is_platform: false,
      sub: "f1e2d3c4-b5a6-4f7e-8d9c-0b1a2f3e4d5c",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    }),
  },
  guard: {
    name: "Suresh Patil (Security Officer)",
    roleDescription: "Camera Exit QR scanner & 4-digit manual OTP fallback verification",
    badge: "Security Guard",
    getPayload: () => ({
      guard_id: "23f46eec-85ab-4b2c-bb7d-ae462f819952",
      restaurant_id: "b1000000-0000-0000-0000-000000000001",
      sub: "23f46eec-85ab-4b2c-bb7d-ae462f819952",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    }),
  },
  platform: {
    name: "Global Platform Super-Admin",
    roleDescription: "Tenant governance, cross-restaurant GMV, commission overrides & fraud review",
    badge: "Super Admin",
    getPayload: () => ({
      staff_id: "13f46eec-85ab-4b2c-bb7d-ae462f819952",
      restaurant_id: "b1000000-0000-0000-0000-000000000001",
      role: "SUPER_ADMIN",
      is_platform: true,
      sub: "13f46eec-85ab-4b2c-bb7d-ae462f819952",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    }),
  },
};
