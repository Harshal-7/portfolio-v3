import type { SectionKey, SiteDoc, SiteLink } from "./schema";

/** Sections the admin switched on, in page order. */
export function visibleSections(doc: Pick<SiteDoc, "sections">): Set<SectionKey> {
  return new Set((Object.keys(doc.sections) as SectionKey[]).filter((key) => doc.sections[key]));
}

export type TextPart = { text: string; anchor?: boolean };

/**
 * Splits a line so the given names can be linked, for example
 * "Now building Evenor and Life Vault." with ["Evenor", "Life Vault"].
 */
export function linkNames(line: string, names: string[]): TextPart[] {
  const wanted = names.map((n) => n.trim()).filter(Boolean);
  if (!line || wanted.length === 0) return line ? [{ text: line }] : [];
  const escaped = [...wanted]
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = line.split(new RegExp(`(${escaped.join("|")})`, "g"));
  return parts.filter(Boolean).map((text) => (wanted.includes(text) ? { text, anchor: true } : { text }));
}

/** "Building something? Email me." → ["Building something?", "Email me."] */
export function splitLead(line: string): [string, string] {
  const match = /^([\s\S]+?[?.!])\s+([\s\S]+)$/.exec(line.trim());
  return match ? [match[1], match[2]] : [line.trim(), ""];
}

/** "Nov 2026" from an ISO date, in UTC so server and browser agree. */
export function monthYear(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`;
}

export function yearOf(iso: string): number {
  return new Date(iso).getUTCFullYear();
}

export function isExternal(href: string): boolean {
  return href.startsWith("https://");
}

/** The LinkedIn link, used as the second button in the contact section. */
export function findLink(links: SiteLink[], host: string): SiteLink | undefined {
  return links.find((l) => {
    try {
      return new URL(l.href).hostname.endsWith(host);
    } catch {
      return false;
    }
  });
}

/**
 * Looping demo clips for the project cards. "framed" clips already include the
 * phone outline; the others get one from CSS.
 */
export const PROJECT_MEDIA = {
  evenor: {
    framed: true,
    mp4: "/projects/evenor-demo.mp4",
    webm: "/projects/evenor-demo.webm",
    poster: "/projects/evenor-demo.jpg",
    width: 360,
    height: 772,
    label: "Evenor: typing a bill, splitting it with the group, then settling up over UPI",
  },
  "life-vault": {
    framed: false,
    mp4: "/projects/lifevault-demo.mp4",
    webm: "/projects/lifevault-demo.webm",
    poster: "/projects/lifevault-demo.jpg",
    width: 360,
    height: 780,
    label: "Life Vault: asking when the fridge warranty ends, then the timeline of upcoming renewals and reminders",
  },
} as const;

/** "A /// B /// C ///" → ["A", "B", "C"]: the ticker's separate phrases. */
export function splitTicker(text: string): string[] {
  const parts = text
    .split(/\/{2,}|\s[•|·]\s/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}

/**
 * External links and the resume open in a new tab, so the portfolio stays open.
 * In-page anchors and mailto: links open as usual.
 */
export function newTab(href: string): { target?: "_blank"; rel?: string } {
  return href.startsWith("https://") || href === "/resume" ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
