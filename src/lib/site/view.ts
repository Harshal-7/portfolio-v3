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

export const PROJECT_IMAGES = {
  evenor: {
    kind: "phones",
    front: { src: "/projects/evenor-trip.jpg", alt: "Evenor trip screen for an Alibaug weekend, showing who owes whom" },
    back: { src: "/projects/evenor-add.jpg", alt: "Evenor add-expense sheet with a box to type the bill" },
    width: 390,
    height: 864,
  },
  "life-vault": {
    kind: "shot",
    front: {
      src: "/projects/lifevault-card.jpg",
      alt: "Life Vault answering “When does my fridge warranty end?” with the date and its source document",
    },
    width: 640,
    height: 480,
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
