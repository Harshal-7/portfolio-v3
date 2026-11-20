import { z } from "zod";

import { DEFAULT_SECTION_ORDER, defaultGames } from "./defaults";

/**
 * The whole site's editable content, stored as one JSON document.
 * Every text field has a length cap, and every link must be https:, mailto:
 * or a path on this site, so admin input can never inject a javascript: URL.
 */

export const DESIGNS = ["notebook", "pixel"] as const;
export const MODES = ["system", "light", "dark"] as const;
export const SECTION_KEYS = ["projects", "earlier", "games", "about", "experience", "stack", "contact"] as const;
export const IMAGE_KEYS = ["evenor", "life-vault", "none"] as const;
export const GAME_ART = ["knight", "imposter", "mafia", "patakha", "none"] as const;

export type Design = (typeof DESIGNS)[number];
export type DefaultMode = (typeof MODES)[number];
export type SectionKey = (typeof SECTION_KEYS)[number];
export type ImageKey = (typeof IMAGE_KEYS)[number];
export type GameArt = (typeof GAME_ART)[number];

/** Every section exactly once: repeats are dropped and missing ones go to the end. */
export function fullSectionOrder(order: readonly SectionKey[]): SectionKey[] {
  const seen = new Set(order);
  return [...seen, ...DEFAULT_SECTION_ORDER.filter((key) => !seen.has(key))];
}

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1, "Can't be empty");

/** https:, mailto:, a same-site path ("/resume") or an in-page anchor ("#work"). */
export function isSafeHref(value: string): boolean {
  const v = value.trim();
  if (v.startsWith("#")) return /^#[A-Za-z][\w-]*$/.test(v);
  if (v.startsWith("/")) return !v.startsWith("//") && !v.startsWith("/\\") && !/[\s\\]/.test(v);
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return url.hostname.length > 0 && !url.username && !url.password;
  if (url.protocol === "mailto:") return /^[^\s@/?#]+@[^\s@/?#]+\.[^\s@/?#]+$/.test(url.pathname);
  return false;
}

const href = text(500).refine(isSafeHref, "Use an https:// link, a mailto: link or a path starting with /");
const optionalHref = z.union([z.literal(""), href]);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #FF7A59");

export const linkSchema = z.object({
  label: required(30),
  href,
});

export const projectSchema = z.object({
  name: required(40),
  tag: text(80),
  one: text(400),
  stack: z.array(required(30)).max(8),
  status: text(16),
  liveHref: optionalHref,
  codeHref: optionalHref,
  imageKey: z.enum(IMAGE_KEYS),
  brand: hex,
  bezel: hex,
});

export const earlierSchema = z.object({
  name: required(60),
  what: text(200),
  meta: text(40),
  href: optionalHref,
});

/** A game card: a list row plus the little animated picture it shows. */
export const gameSchema = earlierSchema.extend({
  art: z.enum(GAME_ART).default("none"),
});

export const experienceSchema = z.object({
  org: required(60),
  role: text(80),
  when: text(40),
  what: text(300),
});

export const stackRowSchema = z.object({
  k: required(20),
  v: required(160),
});

export const resumeSchema = z.object({
  url: z.string().url().max(500),
  pathname: text(300),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime(),
});

/** Everything the admin form edits. The server owns rev, updatedAt and resume. */
export const contentSchema = z.object({
  design: z.enum(DESIGNS),
  defaultMode: z.enum(MODES),
  sections: z.object({
    projects: z.boolean(),
    earlier: z.boolean(),
    /** Older saved documents come from before the games section, so it starts switched on. */
    games: z.boolean().default(true),
    about: z.boolean(),
    experience: z.boolean(),
    stack: z.boolean(),
    contact: z.boolean(),
  }),
  /** Page order of the sections, set by dragging them in the admin. */
  sectionOrder: z
    .array(z.enum(SECTION_KEYS))
    .max(SECTION_KEYS.length * 2)
    .default(() => [...DEFAULT_SECTION_ORDER])
    .transform(fullSectionOrder),
  profile: z.object({
    name: required(60),
    role: text(60),
    headline: required(160),
    intro: text(400),
    now: text(120),
    about: text(1200),
    email: z.string().trim().max(120).email("Use an email address"),
    contactLine: text(200),
  }),
  links: z.array(linkSchema).max(8),
  projects: z.array(projectSchema).max(6),
  earlier: z.array(earlierSchema).max(10),
  /** Older saved documents have no games yet; they get the built-in list. */
  games: z.array(gameSchema).max(6).default(() => defaultGames.map((g) => ({ ...g }))),
  experience: z.array(experienceSchema).max(10),
  stack: z.array(stackRowSchema).max(8),
  pixel: z.object({
    greeting: required(60),
    intro: text(300),
    ticker: text(160),
    /** How long each board line stays before the next one (older documents get the default). */
    boardSeconds: z.number().min(2).max(20).default(4),
  }),
});

export const siteSchema = contentSchema.extend({
  rev: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
  resume: resumeSchema.nullable(),
});

export type SiteContent = z.infer<typeof contentSchema>;
export type SiteDoc = z.infer<typeof siteSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ListItem = z.infer<typeof earlierSchema>;
export type Game = z.infer<typeof gameSchema>;
export type SiteLink = z.infer<typeof linkSchema>;
export type Resume = z.infer<typeof resumeSchema>;

/** Picks the editable part of a document (drops rev, updatedAt and resume). */
export function contentOf(doc: SiteDoc): SiteContent {
  const { rev: _rev, updatedAt: _updatedAt, resume: _resume, ...content } = doc;
  return content;
}

/** "projects › #1 › liveHref: Use an https:// link…" for error lists in the admin page. */
export function issueText(issue: { path: PropertyKey[]; message: string }): string {
  const path = issue.path.map((p) => (typeof p === "number" ? `#${p + 1}` : String(p))).join(" › ");
  return path ? `${path}: ${issue.message}` : issue.message;
}
