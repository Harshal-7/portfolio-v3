import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";

import { localStoresEnabled, redisConfig } from "@/lib/redis";

import { validAdminPath } from "./route";
import { getAdminState } from "./state";
import { newSessionId, SESSION_TTL_SECONDS, signSession, verifySessionToken } from "./token";

/** __Host- means: Secure, Path=/, no Domain, so no other site or subdomain can set it. */
export const SESSION_COOKIE = "__Host-hs_admin";

export class NotSignedInError extends Error {
  constructor() {
    super("You were signed out. Reload the page and sign in again.");
  }
}

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

/** Plain-language list of what's missing, shown on the sign-in page. */
export function adminSetupProblems(): string[] {
  const problems: string[] = [];
  if (!validAdminPath(process.env.ADMIN_PATH)) problems.push("ADMIN_PATH is missing or shorter than 24 characters.");
  if (!sessionSecret()) problems.push("ADMIN_SESSION_SECRET is missing or shorter than 32 characters.");
  if (!process.env.ADMIN_PASSWORD_HASH?.startsWith("scrypt:")) problems.push("ADMIN_PASSWORD_HASH is missing. Run pnpm admin:hash.");
  if (!redisConfig() && !localStoresEnabled()) problems.push("Upstash Redis isn't connected (Vercel → Storage).");
  return problems;
}

async function currentSessionId(): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, secret);
}

export async function isAdmin(): Promise<boolean> {
  // Session checks compare against the clock, so they always run per request.
  await connection();
  const id = await currentSessionId();
  const state = getAdminState();
  if (!id || !state) return false;
  try {
    return await state.hasSession(id);
  } catch (error) {
    console.error("[admin] session lookup failed", error);
    return false;
  }
}

/** First line of every admin Server Action and route. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new NotSignedInError();
}

/** Server Actions and Route Handlers only (it sets a cookie). */
export async function startSession(): Promise<void> {
  const secret = sessionSecret();
  const state = getAdminState();
  if (!secret || !state) throw new Error("Admin isn't set up.");
  const id = newSessionId();
  await state.createSession(id);
  (await cookies()).set(SESSION_COOKIE, signSession(id, secret), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Server Actions and Route Handlers only (it clears a cookie). */
export async function endSession(): Promise<void> {
  const id = await currentSessionId();
  if (id) await getAdminState()?.deleteSession(id);
  // A __Host- cookie can only be cleared with the same Secure and Path=/ it was set with.
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
