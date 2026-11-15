import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { waitUntil } from "@vercel/functions";

import { localStoresEnabled, redisConfig } from "@/lib/redis";

import { SESSION_TTL_SECONDS } from "./token";

/** Admin sessions and login rate limits. Redis in production, memory in local dev. */
export interface AdminState {
  createSession(id: string): Promise<void>;
  hasSession(id: string): Promise<boolean>;
  /** Also ends the session's save unlock. */
  deleteSession(id: string): Promise<void>;
  /** After the save password: changes are allowed for SAVE_UNLOCK_SECONDS. */
  unlockSaving(id: string): Promise<void>;
  isSavingUnlocked(id: string): Promise<boolean>;
  /** Counts a password attempt; false when this key, or everyone together, tried too often. */
  allowLogin(key: string): Promise<boolean>;
}

/** How long the save password keeps changes unlocked. */
export const SAVE_UNLOCK_SECONDS = 15 * 60;
export const PER_IP_TRIES = 5;
export const ALL_TRIES = 100;
const WINDOW_MS = 15 * 60 * 1000;

const sessionKey = (id: string) => `admin:sess:${id}`;
const saveKey = (id: string) => `admin:save:${id}`;

function redisState(redis: Redis): AdminState {
  const perIp = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(PER_IP_TRIES, "15 m"), prefix: "admin:rl:ip" });
  const everyone = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(ALL_TRIES, "15 m"), prefix: "admin:rl:all" });
  return {
    async createSession(id) {
      await redis.set(sessionKey(id), "1", { ex: SESSION_TTL_SECONDS });
    },
    async hasSession(id) {
      return (await redis.exists(sessionKey(id))) === 1;
    },
    async deleteSession(id) {
      await redis.del(sessionKey(id), saveKey(id));
    },
    async unlockSaving(id) {
      await redis.set(saveKey(id), "1", { ex: SAVE_UNLOCK_SECONDS });
    },
    async isSavingUnlocked(id) {
      return (await redis.exists(saveKey(id))) === 1;
    },
    async allowLogin(key) {
      const mine = await perIp.limit(key);
      waitUntil(mine.pending);
      if (!mine.success) return false;
      const all = await everyone.limit("all");
      waitUntil(all.pending);
      return all.success;
    },
  };
}

type Memory = { sessions: Map<string, number>; saves: Map<string, number>; tries: Map<string, number[]> };
const memory: Memory = ((globalThis as { __hsAdminMemory?: Memory }).__hsAdminMemory ??= {
  sessions: new Map(),
  saves: new Map(),
  tries: new Map(),
});

function take(key: string, max: number, now: number): boolean {
  const recent = (memory.tries.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  memory.tries.set(key, recent);
  return recent.length <= max;
}

const memoryState: AdminState = {
  async createSession(id) {
    memory.sessions.set(id, Date.now() + SESSION_TTL_SECONDS * 1000);
  },
  async hasSession(id) {
    const until = memory.sessions.get(id);
    return until !== undefined && until > Date.now();
  },
  async deleteSession(id) {
    memory.sessions.delete(id);
    memory.saves.delete(id);
  },
  async unlockSaving(id) {
    memory.saves.set(id, Date.now() + SAVE_UNLOCK_SECONDS * 1000);
  },
  async isSavingUnlocked(id) {
    const until = memory.saves.get(id);
    return until !== undefined && until > Date.now();
  },
  async allowLogin(key) {
    const now = Date.now();
    return take(`key:${key}`, PER_IP_TRIES, now) && take("all", ALL_TRIES, now);
  },
};

let cached: AdminState | null | undefined;

/** null when neither Redis nor local dev stores are available. */
export function getAdminState(): AdminState | null {
  if (localStoresEnabled()) return memoryState;
  if (cached !== undefined) return cached;
  const config = redisConfig();
  cached = config ? redisState(new Redis(config)) : null;
  return cached;
}
