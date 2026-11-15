import { describe, expect, it } from "vitest";

import { hashPassword as hashFromScript } from "../../../scripts/admin-hash.mjs";
import { hashPassword, verifyPassword } from "./password";
import { createAdminShortcut } from "../site/shortcut";
import { newSessionId, signSession, verifySessionToken } from "./token";

describe("admin shortcut", () => {
  const key = (over: Partial<KeyboardEvent> = {}) =>
    ({ ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, code: "KeyH", ...over }) as KeyboardEvent;

  it("opens on H pressed twice within half a second", () => {
    const press = createAdminShortcut();
    expect(press(key(), 1000)).toBe(false);
    expect(press(key(), 1300)).toBe(true);
    // A third press starts over.
    expect(press(key(), 1400)).toBe(false);
  });

  it("ignores slow presses, modifiers, held keys and other keys in between", () => {
    const press = createAdminShortcut();
    expect(press(key(), 0)).toBe(false);
    expect(press(key(), 900)).toBe(false);
    expect(press(key({ metaKey: true }), 1000)).toBe(false);
    expect(press(key(), 1100)).toBe(false);
    expect(press(key({ repeat: true }), 1150)).toBe(false);
    expect(press(key({ code: "KeyJ" }), 1200)).toBe(false);
    expect(press(key(), 1300)).toBe(false);
    expect(press(key({ ctrlKey: true }), 1350)).toBe(false);
  });
});

describe("password", () => {
  it("verifies the right password and rejects others", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored.split(":")).toHaveLength(6);
    expect(stored).not.toContain("$");
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterY", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("accepts hashes made by pnpm admin:hash", async () => {
    const stored = await hashFromScript("made by the script");
    expect(await verifyPassword("made by the script", stored)).toBe(true);
  });

  it("rejects malformed or weakened hashes", async () => {
    const stored = await hashPassword("pw-for-test-only");
    const parts = stored.split(":");
    expect(await verifyPassword("pw-for-test-only", undefined)).toBe(false);
    expect(await verifyPassword("pw-for-test-only", "plain-text")).toBe(false);
    expect(await verifyPassword("pw-for-test-only", ["scrypt", 2, 1, 1, parts[4], parts[5]].join(":"))).toBe(false);
  });
});

describe("session token", () => {
  const secret = "s".repeat(40);

  it("round-trips a signed id", () => {
    const id = newSessionId();
    expect(verifySessionToken(signSession(id, secret), secret)).toBe(id);
  });

  it("rejects tampering, a different secret and junk", () => {
    const id = newSessionId();
    const token = signSession(id, secret);
    const other = newSessionId();
    expect(verifySessionToken(`${other}.${token.split(".")[1]}`, secret)).toBeNull();
    expect(verifySessionToken(`${token.slice(0, -2)}xx`, secret)).toBeNull();
    expect(verifySessionToken(token, "t".repeat(40))).toBeNull();
    expect(verifySessionToken(undefined, secret)).toBeNull();
    expect(verifySessionToken("no-dot", secret)).toBeNull();
    expect(verifySessionToken(`${id}.`, secret)).toBeNull();
  });
});
