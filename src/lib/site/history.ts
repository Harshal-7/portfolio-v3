import type { SiteDoc } from "./schema";

/** How many earlier versions Undo can step back through. */
export const HISTORY_LIMIT = 10;

/** The current document plus earlier versions, newest first. */
export type StoreState = { doc: SiteDoc | null; history: SiteDoc[] };

export type WriteResult =
  | { ok: true; doc: SiteDoc; dropped: SiteDoc[] }
  | { ok: false; reason: "conflict" | "empty" };

export function currentRev(state: StoreState): number {
  return state.doc?.rev ?? 0;
}

/**
 * Saves `next` if nobody saved since `expectedRev` was read. The old document moves
 * into history; whatever falls off the end of history comes back as `dropped`, so
 * the caller can delete files that no version points to any more.
 */
export function applyWrite(
  state: StoreState,
  next: SiteDoc,
  expectedRev: number,
): { state: StoreState; result: WriteResult } {
  if (currentRev(state) !== expectedRev) return { state, result: { ok: false, reason: "conflict" } };
  if (next.rev !== expectedRev + 1) throw new Error(`next.rev must be ${expectedRev + 1}`);
  const pushed = state.doc ? [state.doc, ...state.history] : state.history;
  return {
    state: { doc: next, history: pushed.slice(0, HISTORY_LIMIT) },
    result: { ok: true, doc: next, dropped: pushed.slice(HISTORY_LIMIT) },
  };
}

/**
 * Brings back the newest earlier version under a new rev. The document being undone
 * is not kept, so it comes back as `dropped`.
 */
export function applyUndo(
  state: StoreState,
  expectedRev: number,
  now: string,
): { state: StoreState; result: WriteResult } {
  if (currentRev(state) !== expectedRev) return { state, result: { ok: false, reason: "conflict" } };
  const [previous, ...rest] = state.history;
  if (!previous) return { state, result: { ok: false, reason: "empty" } };
  const doc: SiteDoc = { ...previous, rev: expectedRev + 1, updatedAt: now };
  return {
    state: { doc, history: rest },
    result: { ok: true, doc, dropped: state.doc ? [state.doc] : [] },
  };
}

/** Résumé files that `dropped` versions used and no kept version still points to. */
export function orphanedResumeUrls(dropped: SiteDoc[], kept: SiteDoc[]): string[] {
  const inUse = new Set(kept.map((d) => d.resume?.url).filter(Boolean));
  const out = new Set<string>();
  for (const d of dropped) {
    const url = d.resume?.url;
    if (url && !inUse.has(url)) out.add(url);
  }
  return [...out];
}
