import { describe, expect, it } from "vitest";

import { defaultSite } from "./defaults";
import { blobHostFromToken, isOwnBlobUrl, looksLikePdf } from "./resume";
import { findLink, linkNames, monthYear, splitLead, visibleSections } from "./view";

describe("visibleSections", () => {
  it("lists only the switched-on sections", () => {
    const sections = { ...defaultSite.sections, earlier: false, stack: false };
    expect([...visibleSections({ sections })]).toEqual(["projects", "about", "experience", "contact"]);
  });
});

describe("linkNames", () => {
  it("marks project names so they can be linked", () => {
    expect(linkNames("Now building Evenor and Life Vault.", ["Evenor", "Life Vault"])).toEqual([
      { text: "Now building " },
      { text: "Evenor", anchor: true },
      { text: " and " },
      { text: "Life Vault", anchor: true },
      { text: "." },
    ]);
  });

  it("treats names as plain text, not patterns", () => {
    expect(linkNames("Try a+b now", ["a+b"])).toEqual([{ text: "Try " }, { text: "a+b", anchor: true }, { text: " now" }]);
  });

  it("leaves the line alone without names", () => {
    expect(linkNames("Hello", [])).toEqual([{ text: "Hello" }]);
  });
});

describe("splitLead", () => {
  it("splits after the first sentence", () => {
    expect(splitLead(defaultSite.profile.contactLine)).toEqual([
      "Building something, hiring, or just want to talk about AI apps?",
      "Email is the fastest way to reach me.",
    ]);
  });
  it("keeps a single sentence whole", () => {
    expect(splitLead("Say hello")).toEqual(["Say hello", ""]);
  });
});

describe("small helpers", () => {
  it("formats month and year in UTC", () => {
    expect(monthYear("2026-11-30T23:30:00.000Z")).toBe("Nov 2026");
  });
  it("finds the LinkedIn link by host", () => {
    expect(findLink(defaultSite.links, "linkedin.com")?.label).toBe("LinkedIn");
    expect(findLink(defaultSite.links, "example.com")).toBeUndefined();
  });
});

describe("résumé checks", () => {
  const token = "vercel_blob_rw_AbC123xyz_secretpart";

  it("reads the store host from the token", () => {
    expect(blobHostFromToken(token)).toBe("abc123xyz.public.blob.vercel-storage.com");
    expect(blobHostFromToken(undefined)).toBeNull();
  });

  it("only allows files on this site's Blob store", () => {
    expect(isOwnBlobUrl("https://abc123xyz.public.blob.vercel-storage.com/resume-x.pdf", token)).toBe(true);
    expect(isOwnBlobUrl("https://other.public.blob.vercel-storage.com/resume.pdf", token)).toBe(false);
    expect(isOwnBlobUrl("https://evil.example/abc123xyz.public.blob.vercel-storage.com", token)).toBe(false);
    expect(isOwnBlobUrl("http://abc123xyz.public.blob.vercel-storage.com/r.pdf", token)).toBe(false);
    expect(isOwnBlobUrl("javascript:alert(1)", token)).toBe(false);
  });

  it("falls back to any Blob host when there is no token", () => {
    expect(isOwnBlobUrl("https://x.public.blob.vercel-storage.com/r.pdf", "")).toBe(true);
    expect(isOwnBlobUrl("https://public.blob.vercel-storage.com.evil.example/r.pdf", "")).toBe(false);
  });

  it("recognises a PDF by its first bytes", () => {
    expect(looksLikePdf(new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
    expect(looksLikePdf(new TextEncoder().encode("<html>"))).toBe(false);
    expect(looksLikePdf(new Uint8Array())).toBe(false);
  });
});
