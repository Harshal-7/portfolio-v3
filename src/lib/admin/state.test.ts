import { beforeAll, describe, expect, it } from "vitest";

import type { AdminState } from "./state";

// The in-memory store used in local dev (SITE_STORE=file).
let state: AdminState;
beforeAll(async () => {
  process.env.SITE_STORE = "file";
  state = (await import("./state")).getAdminState()!;
});

describe("admin state (dev memory)", () => {
  it("unlocks saving per session and forgets it on sign-out", async () => {
    await state.createSession("a");
    expect(await state.isSavingUnlocked("a")).toBe(false);
    await state.unlockSaving("a");
    expect(await state.isSavingUnlocked("a")).toBe(true);
    expect(await state.isSavingUnlocked("b")).toBe(false);
    await state.deleteSession("a");
    expect(await state.hasSession("a")).toBe(false);
    expect(await state.isSavingUnlocked("a")).toBe(false);
  });

  it("counts sign-in and save-password tries separately, 5 each", async () => {
    for (let i = 0; i < 5; i++) expect(await state.allowLogin("login:1.2.3.4")).toBe(true);
    expect(await state.allowLogin("login:1.2.3.4")).toBe(false);
    expect(await state.allowLogin("save:1.2.3.4")).toBe(true);
    expect(await state.allowLogin("login:5.6.7.8")).toBe(true);
  });
});
