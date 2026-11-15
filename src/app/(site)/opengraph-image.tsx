import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { BULB_ROWS } from "@/designs/pixel/bulb-shape";
import { getSite } from "@/lib/site/get-site";
import type { SiteDoc } from "@/lib/site/schema";

/**
 * The link-preview card for X, LinkedIn, WhatsApp and the rest. It follows the
 * live design (Pixel or Notebook) and the text saved in admin: getSite() is
 * tagged, so an admin save refreshes this image along with the page.
 */

export const alt = "Portfolio preview: greeting, tagline and role";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// TTFs from Google Fonts (SIL OFL, licences next to them). ImageResponse can't read woff2.
const font = (file: string) => readFile(join(process.cwd(), "assets/og-fonts", file));
const [pixelify, geist, doto, fraunces] = await Promise.all([
  font("PixelifySans-SemiBold.ttf"),
  font("Geist-Regular.ttf"),
  font("Doto-Bold.ttf"),
  font("Fraunces-Medium.ttf"),
]);

const PALETTES = {
  light: { bg: "#fbfbfa", surface: "#ffffff", fg: "#18181b", muted: "#5b5b63", line: "#e4e4e0", accent: "#4f46e5", soft: "#eef0ff", pill: "#4338ca", pat: "#e9e9e6" },
  dark: { bg: "#141416", surface: "#1b1b1f", fg: "#ececee", muted: "#a1a1aa", line: "#2b2b31", accent: "#a5b4fc", soft: "#23243b", pill: "#c7d0ff", pat: "#202024" },
} as const;
type Palette = (typeof PALETTES)[keyof typeof PALETTES];

const SPARKS = ["#6366f1", "#22a06b", "#f59e0b", "#ec4899"];

export default async function OpenGraphImage() {
  const site = await getSite();
  const mode = site.defaultMode === "system" ? (site.design === "pixel" ? "dark" : "light") : site.defaultMode;
  const p = PALETTES[mode];

  return new ImageResponse(site.design === "pixel" ? <PixelCard site={site} p={p} /> : <NotebookCard site={site} p={p} />, {
    ...size,
    fonts: [
      { name: "Pixelify", data: pixelify, weight: 600, style: "normal" },
      { name: "Geist", data: geist, weight: 400, style: "normal" },
      { name: "Doto", data: doto, weight: 700, style: "normal" },
      { name: "Fraunces", data: fraunces, weight: 500, style: "normal" },
    ],
  });
}

type CardProps = { site: SiteDoc; p: Palette };

/** Smaller type for longer text, so admin edits never spill off the card. */
function fit(text: string, steps: [number, number][], smallest: number) {
  for (const [maxChars, px] of steps) if (text.length <= maxChars) return px;
  return smallest;
}

function PixelCard({ site, p }: CardProps) {
  const { greeting } = site.pixel;
  const { headline, role } = site.profile;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: p.bg, color: p.fg, fontFamily: "Geist" }}>
      <Grid color={p.pat} />
      <Sparkle x={76} y={250} color={SPARKS[0]} />
      <Sparkle x={1090} y={300} color={SPARKS[1]} />
      <Sparkle x={980} y={548} color={SPARKS[3]} />
      <Bulb x={1028} p={p} />

      <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "62px 120px 58px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Pixelify", fontSize: 34 }}>
          <span style={{ color: p.accent }}>huh</span>
          <span style={{ color: p.muted }}>·</span>
          <span>harshal</span>
          <span style={{ width: 16, height: 30, marginLeft: 6, background: p.accent }} />
        </div>

        <div style={{ display: "flex", marginTop: 64, fontFamily: "Pixelify", fontSize: fit(greeting, [[18, 104], [26, 84]], 66), lineHeight: 1.05, maxWidth: 860 }}>
          {greeting}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: fit(headline, [[90, 32], [130, 28]], 24), lineHeight: 1.4, color: p.muted, maxWidth: 820 }}>
          {headline}
        </div>

        {role && (
          <div style={{ display: "flex", marginTop: "auto" }}>
            <div style={{ display: "flex", padding: "10px 22px", background: p.surface, border: `2px solid ${p.line}`, borderRadius: 10, fontFamily: "Doto", fontSize: fit(role, [[26, 38], [40, 28]], 22), letterSpacing: 2, whiteSpace: "nowrap" }}>
              {role.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotebookCard({ site, p }: CardProps) {
  const { name, role, headline } = site.profile;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: p.bg, color: p.fg, fontFamily: "Geist" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 10, background: p.accent }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "72px 88px 64px 88px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: p.accent }} />
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 34 }}>{name}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: fit(headline, [[80, 70], [120, 58]], 46), lineHeight: 1.16, letterSpacing: -1.5, maxWidth: 1020 }}>
          {headline}
        </div>
        <div style={{ display: "flex" }}>
          {role && <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: p.soft, color: p.pill, fontSize: 26, whiteSpace: "nowrap" }}>{role}</div>}
        </div>
      </div>
    </div>
  );
}

/** The faint pixel grid behind the Pixel design. */
function Grid({ color }: { color: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${color}" stroke-width="2"/></pattern></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`;
  return <img alt="" width={1200} height={630} src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} style={{ position: "absolute", left: 0, top: 0 }} />;
}

/** A pixel "+" made of five squares, like the sparkles on the page. */
function Sparkle({ x, y, color }: { x: number; y: number; color: string }) {
  const s = 8;
  const cells: [number, number][] = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: s * 3, height: s * 3, display: "flex" }}>
      {cells.map(([cx, cy]) => (
        <div key={`${cx}${cy}`} style={{ position: "absolute", left: cx * s, top: cy * s, width: s, height: s, background: color }} />
      ))}
    </div>
  );
}

/** The site's pixel bulb, lit, hanging from a dashed cord. */
function Bulb({ x, p }: { x: number; p: Palette }) {
  const s = 9;
  const colors: Record<string, string> = { X: "#ffc93c", H: "#fff4c7", B: p.muted, b: p.line };
  const cordTop = 0;
  const cordHeight = 92;
  return (
    <div style={{ position: "absolute", left: x, top: cordTop, width: s * 9, height: cordHeight + s * 12, display: "flex" }}>
      <div style={{ position: "absolute", left: -60, top: cordHeight - 50, width: s * 9 + 120, height: s * 9 + 120, borderRadius: 999, background: "radial-gradient(circle, rgba(255,201,60,0.35) 0%, rgba(255,201,60,0) 65%)" }} />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={`c${i}`} style={{ position: "absolute", left: s * 4, top: i * 12, width: s, height: 7, background: p.muted }} />
      ))}
      {BULB_ROWS.flatMap((row, ry) =>
        row.split("").map((c, rx) =>
          c === "." ? null : (
            <div key={`${rx}-${ry}`} style={{ position: "absolute", left: rx * s, top: cordHeight + ry * s, width: s, height: s, background: colors[c] }} />
          ),
        ),
      )}
    </div>
  );
}
