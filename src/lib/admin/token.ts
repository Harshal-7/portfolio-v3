import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The admin cookie holds "<session id>.<HMAC of the id>". The id alone is a random
 * 32-byte value kept in Redis with an 8-hour expiry; the signature means a forged
 * or altered cookie is rejected before any Redis lookup.
 */

export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

function sign(id: string, secret: string): string {
  return createHmac("sha256", secret).update(`hs-admin:${id}`).digest("base64url");
}

export function signSession(id: string, secret: string): string {
  return `${id}.${sign(id, secret)}`;
}

/** Returns the session id if the signature checks out, otherwise null. */
export function verifySessionToken(token: string | undefined, secret: string): string | null {
  if (!token || token.length > 200) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  if (!/^[A-Za-z0-9_-]{43}$/.test(id)) return null;
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(id, secret));
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}
