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
 * cells (like the HS mark). It shows one line at a time, starting at the
 * left, and switches to a random other line every few seconds; the new
 * line's pixels light up in a random order.
 */
export function PixelBoard({ text, seconds = 4 }: { text: string; seconds?: number }) {
  const lines = useMemo(() => splitTicker(text), [text]);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  // The board's size on screen, so the grid can cover it exactly.
  const [size, setSize] = useState({ w: 64 * CELL_PX, h: ROWS * CELL_PX });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) setSize({ w: el.clientWidth, h: el.clientHeight });
    };
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
    }, Math.max(2, seconds) * 1000);
    return () => window.clearInterval(id);
  }, [lines.length, seconds]);

  const line = lines[index % Math.max(lines.length, 1)] ?? "";
  const { cells, width } = layoutBoard([{ text: line, tone: index % 2 ? "accent" : "fg" }]);
  if (lines.length === 0) return null;

  // Square cells sized by the board's height, or smaller when a long line needs
  // more columns. The grid then covers the whole board (the last partial column
  // and row are cropped), so there's never a blank strip at an edge. Words start
  // two cells in from the left and sit in the middle vertically.
  const offset = 2;
  const cell = Math.min(size.h / ROWS, size.w / (width + offset * 2));
  const viewCols = Math.ceil(size.w / cell);
  const viewRows = Math.ceil(size.h / cell);
  const shiftY = Math.floor((viewRows - GLYPH_ROWS) / 2) - PAD_Y;

  return (
    <div ref={box} className="pb-board" role="marquee" aria-label={lines.map((l) => (/[.!?]$/.test(l) ? l : `${l}.`)).join(" ")}>
      <svg className="pb-svg" viewBox={`0 0 ${viewCols} ${viewRows}`} preserveAspectRatio="xMinYMin slice" shapeRendering="crispEdges" aria-hidden="true">
        <defs>
          <pattern id="pb-off" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect className="pb-offcell" x="0.08" y="0.08" width="0.84" height="0.84" />
          </pattern>
        </defs>
        <rect width={viewCols} height={viewRows} fill="url(#pb-off)" />
        <g key={round}>
          {cells.map((c) => (
            <rect
              key={`${c.x}-${c.y}`}
              className={`pb-on pb-${c.tone}`}
              x={c.x + offset + 0.08}
              y={c.y + shiftY + 0.08}
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
