/**
 * Small icons for the link buttons, picked from the link itself. Notebook uses
 * one-colour line marks; Pixel uses pixel-drawn versions so they match its
 * look. Both take the text colour, so they follow light and dark mode.
 */

export type LinkKind = "resume" | "email" | "github" | "linkedin" | "x" | "link";

export function linkKind(href: string): LinkKind {
  if (href === "/resume") return "resume";
  if (href.startsWith("mailto:")) return "email";
  let host = "";
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
  if (host === "github.com") return "github";
  if (host.endsWith("linkedin.com")) return "linkedin";
  if (host === "x.com" || host === "twitter.com") return "x";
  return "link";
}

// --- Notebook: line and solid marks (24 × 24) ------------------------------

const SOLID: Partial<Record<LinkKind, string>> = {
  github:
    "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3",
  linkedin:
    "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1Zm1.8 13.1H3.6V9h3.5v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z",
  x: "M18.9 1.2h3.7l-8 9.1 9.4 12.5h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.2H4.3l13.3 17.4Z",
};

const LINE: Partial<Record<LinkKind, string>> = {
  resume: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v5h5M9.5 13h5M9.5 16.5h5",
  email: "M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11ZM4 6.5l8 6.5 8-6.5",
  link: "M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1.2 1.2M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1.2-1.2",
};

export function LineIcon({ kind, className }: { kind: LinkKind; className?: string }) {
  const solid = SOLID[kind];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {solid ? (
        <path d={solid} fill="currentColor" />
      ) : (
        <path d={LINE[kind]} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// --- Pixel: 8 × 8 pixel drawings ("X" = lit) --------------------------------

const PIXEL: Record<LinkKind, string[]> = {
  resume: ["XXXXX...", "X...XX..", "X.XX.XX.", "X......X", "X.XXXX.X", "X......X", "X.XXXX.X", "XXXXXXXX"],
  email: ["........", "XXXXXXXX", "XX....XX", "X.X..X.X", "X..XX..X", "X......X", "XXXXXXXX", "........"],
  github: ["X......X", "XX....XX", "XXXXXXXX", "XX.XX.XX", "XXXXXXXX", ".XXXXXX.", "..X..X..", ".X....X."],
  linkedin: ["XXXXXXXX", "X.XXXXXX", "XXXXXXXX", "X.X..XXX", "X.X.X.XX", "X.X.X.XX", "X.X.X.XX", "XXXXXXXX"],
  x: ["X......X", ".X....X.", "..X..X..", "...XX...", "...XX...", "..X..X..", ".X....X.", "X......X"],
  link: ["...XXXXX", "......XX", ".....X.X", "....X..X", "...X....", "..X.....", ".X......", "X......."],
};

export function PixelIcon({ kind, className }: { kind: LinkKind; className?: string }) {
  const rows = PIXEL[kind];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        row.split("").map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null)),
      )}
    </svg>
  );
}
