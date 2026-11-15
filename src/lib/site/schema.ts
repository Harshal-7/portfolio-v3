import { z } from "zod";

/**
 * The whole site's editable content, stored as one JSON document.
 * Every text field has a length cap, and every link must be https:, mailto:
 * or a path on this site, so admin input can never inject a javascript: URL.
 */

export const DESIGNS = ["notebook", "pixel"] as const;
export const MODES = ["system", "light", "dark"] as const;
export const SECTION_KEYS = ["projects", "earlier", "about", "experience", "stack", "contact"] as const;
export const IMAGE_KEYS = ["evenor", "life-vault", "none"] as const;

export type Design = (typeof DESIGNS)[number];
export type DefaultMode = (typeof MODES)[number];
export type SectionKey = (typeof SECTION_KEYS)[number];
export type ImageKey = (typeof IMAGE_KEYS)[number];

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
  liveLabel: text(40),
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
    about: z.boolean(),
    experience: z.boolean(),
    stack: z.boolean(),
    contact: z.boolean(),
  }),
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
  experience: z.array(experienceSchema).max(10),
  stack: z.array(stackRowSchema).max(8),
  pixel: z.object({
    greeting: required(60),
    intro: text(300),
    ticker: text(160),
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
export type SiteLink = z.infer<typeof linkSchema>;
export type Resume = z.infer<typeof resumeSchema>;

/** Picks the editable part of a document (drops rev, updatedAt and resume). */
export function contentOf(doc: SiteDoc): SiteContent {
  const { rev: _rev, updatedAt: _updatedAt, resume: _resume, ...content } = doc;
  return content;
}
