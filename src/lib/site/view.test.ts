import { describe, expect, it } from "vitest";

import { defaultSite } from "./defaults";
import { blobConfigured, blobStoreId, isResumePathname, looksLikePdf, ownBlobAccess, resumeFileName } from "./resume";
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
  const env = { BLOB_STORE_ID: "store_AbC123xyz", BLOB_WEBHOOK_PUBLIC_KEY: "key" };

  it("reads the store id from BLOB_STORE_ID or an older read-write token", () => {
    expect(blobStoreId(env)).toBe("abc123xyz");
    expect(blobStoreId({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_AbC123xyz_secretpart" })).toBe("abc123xyz");
    expect(blobStoreId({})).toBeNull();
  });

  it("needs both the store id and the webhook key for uploads", () => {
    expect(blobConfigured(env)).toBe(true);
    expect(blobConfigured({ BLOB_STORE_ID: "store_AbC123xyz" })).toBe(false);
  });

  it("only accepts files on this site's own store", () => {
    expect(ownBlobAccess("https://abc123xyz.private.blob.vercel-storage.com/resume/cv-1a2b.pdf", env)).toBe("private");
    expect(ownBlobAccess("https://abc123xyz.public.blob.vercel-storage.com/resume/cv.pdf", env)).toBe("public");
    expect(ownBlobAccess("https://other.private.blob.vercel-storage.com/resume/cv.pdf", env)).toBeNull();
    expect(ownBlobAccess("https://evil.example/abc123xyz.private.blob.vercel-storage.com", env)).toBeNull();
    expect(ownBlobAccess("http://abc123xyz.private.blob.vercel-storage.com/r.pdf", env)).toBeNull();
    expect(ownBlobAccess("https://abc123xyz.private.blob.vercel-storage.com.evil.example/r.pdf", env)).toBeNull();
    expect(ownBlobAccess("javascript:alert(1)", env)).toBeNull();
    expect(ownBlobAccess("https://abc123xyz.private.blob.vercel-storage.com/r.pdf", {})).toBeNull();
  });

  it("only allows résumé upload names", () => {
    expect(isResumePathname("resume/Harshal-CV-1a2b3c4d.pdf")).toBe(true);
    expect(isResumePathname("resume/../secret.pdf")).toBe(false);
    expect(isResumePathname("other/cv.pdf")).toBe(false);
    expect(isResumePathname("resume/cv.html")).toBe(false);
  });

  it("names the downloaded file after the person", () => {
    expect(resumeFileName("Harshal Shinde")).toBe("Harshal-Shinde-Resume.pdf");
    expect(resumeFileName("")).toBe("Resume.pdf");
  });

  it("recognises a PDF by its first bytes", () => {
    expect(looksLikePdf(new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
    expect(looksLikePdf(new TextEncoder().encode("<html>"))).toBe(false);
    expect(looksLikePdf(new Uint8Array())).toBe(false);
  });
});
