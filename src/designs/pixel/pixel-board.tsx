"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { splitTicker } from "@/lib/site/view";

import { glyph, GLYPH_ROWS } from "./pixel-font";

type Tone = "fg" | "accent" | "muted";
type Cell = { x: number; y: number; tone: Tone };

const PAD_Y = 1; // one empty row above and below the letters
const ROWS = GLYPH_ROWS + PAD_Y * 2;
const GAP = 1; // empty column between characters
const CELL_PX = 6; // preferred cell size on screen
const SWITCH_MS = 3800;

/** Lays the text out as lit cells from column 0. Returns the cells and the width in columns. */
export function layoutBoard(segments: { text: string; tone: Tone }[]): { cells: Cell[]; width: number } {
  const cells: Cell[] = [];
  let x = 0;
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
  return { cells, width: Math.max(0, x - GAP) };
}

/** A stable pseudo-random number in [0, 1) for a cell, so the fill-in order differs per line. */
function noise(a: number, b: number, c: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * The now-building board: letters made of pixel blocks on a board of dim
 * cells (like the HS mark). It shows one line at a time and switches to a
 * random other line every few seconds; the new line's pixels light up in a
 * random order.
 */
export function PixelBoard({ text }: { text: string }) {
  const lines = useMemo(() => splitTicker(text), [text]);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [cols, setCols] = useState(64);
  const box = useRef<HTMLDivElement>(null);

  // Fill the board's width with cells of about CELL_PX.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setCols(Math.max(24, Math.floor(el.clientWidth / CELL_PX)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Every few seconds, show a random other line.
  useEffect(() => {
    if (lines.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => {
        let next = current;
        while (next === current) next = Math.floor(Math.random() * lines.length);
        return next;
      });
      setRound((r) => r + 1);
    }, SWITCH_MS);
    return () => window.clearInterval(id);
  }, [lines.length]);

  const line = lines[index % Math.max(lines.length, 1)] ?? "";
  const { cells, width } = layoutBoard([{ text: line, tone: index % 2 ? "accent" : "fg" }]);
  if (lines.length === 0) return null;

  // Wide enough for the line (it shrinks if it doesn't fit), centred.
  const viewCols = Math.max(cols, width + 4);
  const offset = Math.floor((viewCols - width) / 2);

  return (
    <div ref={box} className="pb-board" role="marquee" aria-label={lines.map((l) => (/[.!?]$/.test(l) ? l : `${l}.`)).join(" ")}>
      <svg className="pb-svg" viewBox={`0 0 ${viewCols} ${ROWS}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">
        <defs>
          <pattern id="pb-off" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect className="pb-offcell" x="0.08" y="0.08" width="0.84" height="0.84" />
          </pattern>
        </defs>
        <rect width={viewCols} height={ROWS} fill="url(#pb-off)" />
        <g key={round}>
          {cells.map((c) => (
            <rect
              key={`${c.x}-${c.y}`}
              className={`pb-on pb-${c.tone}`}
              x={c.x + offset + 0.08}
              y={c.y + 0.08}
              width="0.84"
              height="0.84"
              style={round ? { animationDelay: `${(noise(c.x, c.y, round) * 0.5).toFixed(2)}s` } : undefined}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
