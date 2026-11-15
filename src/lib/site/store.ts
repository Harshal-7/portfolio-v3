import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { getRedis, localStoresEnabled } from "@/lib/redis";

import { applyUndo, applyWrite, HISTORY_LIMIT, type StoreState, type WriteResult } from "./history";
import { siteSchema, type SiteDoc } from "./schema";

export type { WriteResult } from "./history";

export interface SiteStore {
  /** The saved document, or null if nothing was saved yet. Throws if it can't be read. */
  read(): Promise<SiteDoc | null>;
  /** The saved document and every earlier version Undo can reach. */
  readAll(): Promise<StoreState>;
  write(next: SiteDoc, expectedRev: number): Promise<WriteResult>;
  undo(expectedRev: number, now: string): Promise<WriteResult>;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Content storage isn't set up. Connect Upstash Redis in Vercel → Storage.");
  }
}

function parseDoc(raw: unknown): SiteDoc {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  return siteSchema.parse(value);
}

/** Old versions that no longer validate are skipped rather than breaking the admin page. */
function parseHistory(raw: unknown[]): SiteDoc[] {
  const out: SiteDoc[] = [];
  for (const item of raw) {
    try {
      out.push(parseDoc(item));
    } catch {
      // skip
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Redis: the live store. Each write is one Lua script, so a save is atomic and
// two open admin tabs can't overwrite each other (compare-and-set on rev).

const KEY_DOC = "site:doc";
const KEY_HISTORY = "site:history";
const KEY_REV = "site:rev";

const WRITE_SCRIPT = `
local cur = tonumber(redis.call('GET', KEYS[3]) or '0')
if cur ~= tonumber(ARGV[1]) then return {0} end
local old = redis.call('GET', KEYS[1])
local dropped = {}
if old then
  local limit = tonumber(ARGV[3])
  redis.call('LPUSH', KEYS[2], old)
  dropped = redis.call('LRANGE', KEYS[2], limit, -1)
  redis.call('LTRIM', KEYS[2], 0, limit - 1)
end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[3], tostring(cur + 1))
return {1, dropped}
`;

const UNDO_SCRIPT = `
local cur = tonumber(redis.call('GET', KEYS[3]) or '0')
if cur ~= tonumber(ARGV[1]) then return {0} end
local top = redis.call('LINDEX', KEYS[2], 0)
if not top then return {2} end
if top ~= ARGV[3] then return {0} end
redis.call('LPOP', KEYS[2])
local old = redis.call('GET', KEYS[1])
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[3], tostring(cur + 1))
if old then return {1, {old}} end
return {1, {}}
`;

function scriptResult(raw: unknown, doc: SiteDoc): WriteResult {
  const [code, dropped] = (Array.isArray(raw) ? raw : [0]) as [number, unknown[] | undefined];
  if (Number(code) === 1) return { ok: true, doc, dropped: parseHistory(dropped ?? []) };
  if (Number(code) === 2) return { ok: false, reason: "empty" };
  return { ok: false, reason: "conflict" };
}

function redisStore(): SiteStore {
  const redis = getRedis();
  if (!redis) throw new StoreNotConfiguredError();
  return {
    async read() {
      const raw = await redis.get<string>(KEY_DOC);
      return raw == null ? null : parseDoc(raw);
    },
    async readAll() {
      const [raw, history] = await Promise.all([
        redis.get<string>(KEY_DOC),
        redis.lrange<string>(KEY_HISTORY, 0, HISTORY_LIMIT - 1),
      ]);
      return { doc: raw == null ? null : parseDoc(raw), history: parseHistory(history) };
    },
    async write(next, expectedRev) {
      const raw = await redis.eval(
        WRITE_SCRIPT,
        [KEY_DOC, KEY_HISTORY, KEY_REV],
        [String(expectedRev), JSON.stringify(next), String(HISTORY_LIMIT)],
      );
      return scriptResult(raw, next);
    },
    async undo(expectedRev, now) {
      const top = (await redis.lindex(KEY_HISTORY, 0)) as string | null;
      if (top == null) return { ok: false, reason: "empty" };
      const restored: SiteDoc = { ...parseDoc(top), rev: expectedRev + 1, updatedAt: now };
      const raw = await redis.eval(
        UNDO_SCRIPT,
        [KEY_DOC, KEY_HISTORY, KEY_REV],
        [String(expectedRev), JSON.stringify(restored), top],
      );
      return scriptResult(raw, restored);
    },
  };
}

// ---------------------------------------------------------------------------
// File: dev only (SITE_STORE=file), so the admin flow can be tried without accounts.

const FILE = path.join(process.cwd(), ".data", "site.json");
let queue: Promise<unknown> = Promise.resolve();

async function loadFile(): Promise<StoreState> {
  let text: string;
  try {
    text = await readFile(FILE, "utf8");
  } catch {
    return { doc: null, history: [] };
  }
  const data = JSON.parse(text) as { doc: unknown; history?: unknown[] };
  return { doc: data.doc == null ? null : parseDoc(data.doc), history: parseHistory(data.history ?? []) };
}

async function saveFile(state: StoreState): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2));
  await rename(tmp, FILE);
}

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

function fileStore(): SiteStore {
  const mutate = (step: (s: StoreState) => { state: StoreState; result: WriteResult }) =>
    serial(async () => {
      const { state, result } = step(await loadFile());
      if (result.ok) await saveFile(state);
      return result;
    });
  return {
    read: async () => (await loadFile()).doc,
    readAll: loadFile,
    write: (next, expectedRev) => mutate((s) => applyWrite(s, next, expectedRev)),
    undo: (expectedRev, now) => mutate((s) => applyUndo(s, expectedRev, now)),
  };
}

// ---------------------------------------------------------------------------

/** Nothing configured: the site shows its defaults and saving explains what to set up. */
const emptyStore: SiteStore = {
  read: async () => null,
  readAll: async () => ({ doc: null, history: [] }),
  write: async () => {
    throw new StoreNotConfiguredError();
  },
  undo: async () => {
    throw new StoreNotConfiguredError();
  },
};

export function getStore(): SiteStore {
  if (localStoresEnabled()) return fileStore();
  return getRedis() ? redisStore() : emptyStore;
}
