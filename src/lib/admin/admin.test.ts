import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { hashPassword as hashFromScript } from "../../../scripts/admin-hash.mjs";
import { config } from "../../proxy";
import { hashPassword, verifyPassword } from "./password";
import { routeAdmin } from "./route";
import { newSessionId, signSession, verifySessionToken } from "./token";

const SECRET_PATH = "Xq7_secret-admin-path-000123";

describe("routeAdmin", () => {
  it("rewrites the secret path and everything under it", () => {
    expect(routeAdmin(`/${SECRET_PATH}`, SECRET_PATH)).toEqual({ type: "admin", pathname: "/admin" });
    expect(routeAdmin(`/${SECRET_PATH}/upload`, SECRET_PATH)).toEqual({ type: "admin", pathname: "/admin/upload" });
    expect(routeAdmin(`/${SECRET_PATH}/preview/pixel`, SECRET_PATH)).toEqual({
      type: "admin",
      pathname: "/admin/preview/pixel",
    });
  });

  it("returns 404 for /admin in every spelling", () => {
    for (const p of ["/admin", "/Admin", "/ADMIN/upload", "/%61dmin", "/admin.rsc", "//admin", "/admin;x"]) {
      expect(routeAdmin(p, SECRET_PATH), p).toEqual({ type: "not-found" });
    }
  });

  it("does not match lookalikes of the secret", () => {
    expect(routeAdmin(`/${SECRET_PATH}x`, SECRET_PATH)).toEqual({ type: "pass" });
    expect(routeAdmin(`/${SECRET_PATH.toLowerCase()}`, SECRET_PATH)).toEqual({ type: "pass" });
    expect(routeAdmin("/administrator", SECRET_PATH)).toEqual({ type: "pass" });
  });

  it("turns admin off when ADMIN_PATH is missing or too short", () => {
    expect(routeAdmin("/short", "short")).toEqual({ type: "pass" });
    expect(routeAdmin("/anything", undefined)).toEqual({ type: "pass" });
    expect(routeAdmin("/admin", undefined)).toEqual({ type: "not-found" });
  });
});

describe("proxy matcher", () => {
  const matches = (url: string) => unstable_doesMiddlewareMatch({ config, url });

  it("runs on the admin paths", () => {
    expect(matches(`/${SECRET_PATH}`)).toBe(true);
    expect(matches("/admin")).toBe(true);
    expect(matches("/resume")).toBe(true);
  });

  it("never runs on the home page or static files", () => {
    expect(matches("/")).toBe(false);
    expect(matches("/_next/static/chunks/app.js")).toBe(false);
    expect(matches("/projects/evenor-trip.jpg")).toBe(false);
    expect(matches("/grain.png")).toBe(false);
    expect(matches("/robots.txt")).toBe(false);
    expect(matches("/_vercel/insights/script.js")).toBe(false);
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
