import "server-only";

import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

export function redisConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/**
 * Upstash Redis, or null when it isn't configured. Vercel's Upstash integration
 * sets the KV_* names; a manual setup usually uses the UPSTASH_* names.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const config = redisConfig();
  // Values are parsed with zod by the callers, so keep Upstash from guessing types.
  client = config ? new Redis({ ...config, automaticDeserialization: false }) : null;
  return client;
}

/** Dev only: keep content in .data/ and admin state in memory instead of Redis. */
export function localStoresEnabled(): boolean {
  return process.env.SITE_STORE === "file" && process.env.NODE_ENV !== "production";
}
