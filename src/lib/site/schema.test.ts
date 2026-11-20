import { describe, expect, it } from "vitest";

import { DEFAULT_SECTION_ORDER, defaultSite } from "./defaults";
import { contentOf, contentSchema, isSafeHref, siteSchema } from "./schema";

describe("isSafeHref", () => {
  it.each([
    "https://github.com/Harshal-7",
    "mailto:someone@example.com",
    "/resume",
    "#work",
  ])("accepts %s", (href) => expect(isSafeHref(href)).toBe(true));

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://example.com",
    "//evil.example",
    "/\\evil.example",
    "https://user:pass@example.com",
    "mailto:",
    "vbscript:msgbox(1)",
    "#",
    "# work",
  ])("rejects %s", (href) => expect(isSafeHref(href)).toBe(false));
});

describe("site schema", () => {
  it("accepts the default content", () => {
    expect(siteSchema.parse(defaultSite)).toEqual(defaultSite);
  });

  it("rejects a javascript: link anywhere", () => {
    const bad = structuredClone(contentOf(defaultSite));
    bad.projects[0].liveHref = "javascript:alert(document.cookie)";
    expect(contentSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects text over the length cap", () => {
    const bad = structuredClone(contentOf(defaultSite));
    bad.profile.headline = "x".repeat(161);
    expect(contentSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an unknown design and too many links", () => {
    const bad = structuredClone(contentOf(defaultSite)) as Record<string, unknown>;
    expect(contentSchema.safeParse({ ...bad, design: "terminal" }).success).toBe(false);
    const links = Array.from({ length: 9 }, () => ({ label: "x", href: "https://x.com" }));
    expect(contentSchema.safeParse({ ...bad, links }).success).toBe(false);
  });

  it("drops server-owned fields from admin input", () => {
    const sneaky = { ...contentOf(defaultSite), rev: 99, resume: { url: "https://evil.example/x.pdf" } };
    const parsed = contentSchema.parse(sneaky) as Record<string, unknown>;
    expect(parsed.rev).toBeUndefined();
    expect(parsed.resume).toBeUndefined();
  });

  it("gives older saved content the default board timing", () => {
    const { boardSeconds: _skip, ...pixel } = defaultSite.pixel;
    expect(siteSchema.parse({ ...defaultSite, pixel }).pixel.boardSeconds).toBe(4);
    expect(contentSchema.safeParse({ ...contentOf(defaultSite), pixel: { ...pixel, boardSeconds: 1 } }).success).toBe(false);
  });

  it("gives older saved content the games, switched on", () => {
    const { games: _games, ...sections } = defaultSite.sections;
    const { games: _list, ...older } = defaultSite;
    const parsed = siteSchema.parse({ ...older, sections });
    expect(parsed.sections.games).toBe(true);
    expect(parsed.games).toEqual(defaultSite.games);
    expect(parsed.games).not.toBe(defaultSite.games);
  });

  it("gives older documents the default section order and fills in missing sections", () => {
    const { sectionOrder: _order, ...older } = defaultSite;
    expect(siteSchema.parse(older).sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
    expect(siteSchema.parse({ ...defaultSite, sectionOrder: ["contact", "contact", "games"] }).sectionOrder).toEqual([
      "contact",
      "games",
      "projects",
      "experience",
      "earlier",
      "about",
      "stack",
    ]);
  });

  it("ships the four games, all on the games site, each with its picture", () => {
    expect(defaultSite.games.map((g) => g.art)).toEqual(["knight", "imposter", "mafia", "patakha"]);
    for (const g of defaultSite.games) expect(g.href.startsWith("https://games.huhharshal.com/")).toBe(true);
  });

  it("gives a game without a picture no art", () => {
    const { art: _art, ...game } = defaultSite.games[0];
    expect(siteSchema.parse({ ...defaultSite, games: [game] }).games[0].art).toBe("none");
  });

  it("trims text", () => {
    const input = structuredClone(contentOf(defaultSite));
    input.profile.name = "  Harshal Shinde  ";
    expect(contentSchema.parse(input).profile.name).toBe("Harshal Shinde");
  });
});
