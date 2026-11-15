import { describe, expect, it } from "vitest";

import { defaultSite } from "./defaults";
import { applyUndo, applyWrite, HISTORY_LIMIT, orphanedResumeUrls, type StoreState } from "./history";
import type { SiteDoc } from "./schema";

const doc = (rev: number, resume: string | null = null): SiteDoc => ({
  ...defaultSite,
  rev,
  resume: resume ? { url: resume, pathname: "r.pdf", size: 1, uploadedAt: "2026-11-15T00:00:00.000Z" } : null,
});

describe("applyWrite", () => {
  it("saves the first document with an empty history", () => {
    const { state, result } = applyWrite({ doc: null, history: [] }, doc(1), 0);
    expect(result).toEqual({ ok: true, doc: doc(1), dropped: [] });
    expect(state).toEqual({ doc: doc(1), history: [] });
  });

  it("keeps the defaults as the first undo step when given a seed", () => {
    const { state } = applyWrite({ doc: null, history: [] }, doc(1), 0, doc(0));
    expect(state.history.map((d) => d.rev)).toEqual([0]);
  });

  it("refuses a stale rev, so two tabs can't overwrite each other", () => {
    const start: StoreState = { doc: doc(3), history: [] };
    const { state, result } = applyWrite(start, doc(3), 2);
    expect(result).toEqual({ ok: false, reason: "conflict" });
    expect(state).toBe(start);
  });

  it("moves the old document into history, newest first", () => {
    let state: StoreState = { doc: null, history: [] };
    for (let rev = 1; rev <= 3; rev++) state = applyWrite(state, doc(rev), rev - 1).state;
    expect(state.doc?.rev).toBe(3);
    expect(state.history.map((d) => d.rev)).toEqual([2, 1]);
  });

  it("keeps at most HISTORY_LIMIT versions and reports what fell off", () => {
    let state: StoreState = { doc: null, history: [] };
    const dropped: number[] = [];
    for (let rev = 1; rev <= HISTORY_LIMIT + 3; rev++) {
      const step = applyWrite(state, doc(rev), rev - 1);
      state = step.state;
      if (step.result.ok) dropped.push(...step.result.dropped.map((d) => d.rev));
    }
    expect(state.history).toHaveLength(HISTORY_LIMIT);
    expect(dropped).toEqual([1, 2]);
  });
});

describe("applyUndo", () => {
  it("brings back the previous version under a new rev", () => {
    const start: StoreState = { doc: { ...doc(5), design: "pixel" }, history: [doc(4), doc(3)] };
    const { state, result } = applyUndo(start, 5, "2026-11-16T00:00:00.000Z");
    expect(result.ok).toBe(true);
    expect(state.doc?.rev).toBe(6);
    expect(state.doc?.design).toBe("notebook");
    expect(state.doc?.updatedAt).toBe("2026-11-16T00:00:00.000Z");
    expect(state.history.map((d) => d.rev)).toEqual([3]);
    if (result.ok) expect(result.dropped.map((d) => d.design)).toEqual(["pixel"]);
  });

  it("says when there is nothing to undo", () => {
    expect(applyUndo({ doc: doc(1), history: [] }, 1, "x").result).toEqual({ ok: false, reason: "empty" });
  });

  it("refuses a stale rev", () => {
    expect(applyUndo({ doc: doc(2), history: [doc(1)] }, 1, "x").result).toEqual({ ok: false, reason: "conflict" });
  });
});

describe("orphanedResumeUrls", () => {
  it("only returns files no kept version points to", () => {
    const dropped = [doc(1, "https://a/old.pdf"), doc(2, "https://a/shared.pdf")];
    const kept = [doc(3, "https://a/shared.pdf"), doc(4)];
    expect(orphanedResumeUrls(dropped, kept)).toEqual(["https://a/old.pdf"]);
  });
});
