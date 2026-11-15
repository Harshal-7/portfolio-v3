import { splitTicker } from "@/lib/site/view";

import { glyph, GLYPH_ROWS } from "./pixel-font";

type Tone = "fg" | "accent" | "muted";
type Cell = { x: number; y: number; tone: Tone };

const PAD_Y = 1; // one empty row above and below the letters
const GAP = 1; // empty column between characters

/** Lays the text out as lit cells. Returns the cells and the width in columns. */
export function layoutBoard(segments: { text: string; tone: Tone }[]): { cells: Cell[]; width: number } {
  const cells: Cell[] = [];
  let x = 2;
  for (const seg of segments) {
    for (const ch of seg.text) {
      const rows = glyph(ch);
      rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          if (row[c] === "X") cells.push({ x: x + c, y: r + PAD_Y, tone: seg.tone });
        }
      });
      x += rows[0].length + GAP;
    }
  }
  return { cells, width: x + 1 };
}

/** One full pass of the message: each line, then a separator diamond. */
function message(text: string): { text: string; tone: Tone }[] {
  return splitTicker(text).flatMap((phrase, i) => [
    { text: phrase, tone: i % 2 === 0 ? ("fg" as const) : ("accent" as const) },
    { text: "  ◆  ", tone: "muted" as const },
  ]);
}

function BoardSvg({ cells, width }: { cells: Cell[]; width: number }) {
  const height = GLYPH_ROWS + PAD_Y * 2;
  return (
    <svg className="pb-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMid meet" shapeRendering="crispEdges">
      <rect width={width} height={height} fill="url(#pb-off)" />
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} className={`pb-on pb-${c.tone}`} x={c.x + 0.08} y={c.y + 0.08} width="0.84" height="0.84" />
      ))}
    </svg>
  );
}

/**
 * The now-building strip: letters drawn with pixel blocks on a board of dim
 * cells (like the HS mark), scrolling past like an LED sign. Pure SVG and CSS.
 */
export function PixelBoard({ text }: { text: string }) {
  const { cells, width } = layoutBoard(message(text));
  if (cells.length === 0) return null;
  return (
    <div className="pb-board" role="marquee" aria-label={splitTicker(text).join(". ")}>
      <svg width="0" height="0" aria-hidden="true" className="pb-defs">
        <defs>
          <pattern id="pb-off" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect className="pb-offcell" x="0.08" y="0.08" width="0.84" height="0.84" />
          </pattern>
        </defs>
      </svg>
      <div className="pb-track" aria-hidden="true" style={{ animationDuration: `${Math.round(width / 9)}s` }}>
        <BoardSvg cells={cells} width={width} />
        <BoardSvg cells={cells} width={width} />
      </div>
    </div>
  );
}
