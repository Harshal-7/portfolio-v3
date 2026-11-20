/**
 * Pictures for the game cards: pixel sprites for Pixel, and the knight's route
 * for both designs. Sprites are rows of "X" (lit) and "." (empty).
 */

export type Square = readonly [col: number, row: number];

/** A strip of a chessboard: wide enough to show the knight's L-shaped jumps. */
export const BOARD = { cols: 8, rows: 3 } as const;

/** Pixel's knight hops round this closed loop forever (the last square jumps back to the first). */
export const KNIGHT_LOOP: readonly Square[] = [
  [0, 0], [1, 2], [3, 1], [5, 0], [6, 2], [7, 0], [5, 1], [3, 2], [4, 0], [2, 1],
];

/** Notebook draws this open route, chosen for few crossing lines. */
export const KNIGHT_ROUTE: readonly Square[] = [
  [0, 0], [1, 2], [3, 1], [1, 0], [2, 2], [4, 1], [6, 2], [7, 0], [5, 1], [3, 0], [4, 2], [6, 1],
];

export function isKnightMove(a: Square, b: Square): boolean {
  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

/** 8 × 8, facing left. */
export const KNIGHT_SPRITE = [
  "....XX..",
  "...XXXX.",
  "..XX.XXX",
  ".XXXXXXX",
  "XXXXXXXX",
  "XX..XXXX",
  "....XXXX",
  "..XXXXXX",
] as const;

/** 7 × 8: a head with two eyes, on shoulders. */
export const PLAYER_SPRITE = [
  "..XXX..",
  ".XXXXX.",
  ".X.X.X.",
  ".XXXXX.",
  "..XXX..",
  ".XXXXX.",
  "XXXXXXX",
  "XXXXXXX",
] as const;

/** 5 × 6, drawn on the imposter's card. */
export const QUESTION_SPRITE = [
  ".XXX.",
  "X...X",
  "...X.",
  "..X..",
  ".....",
  "..X..",
] as const;

/** 7 × 6, for the lives in the Arcade heading. */
export const HEART_SPRITE = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
] as const;

/** The lit cells of a sprite, as [x, y] pairs. */
export function litCells(rows: readonly string[]): [number, number][] {
  const out: [number, number][] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === "X") out.push([x, y]);
  });
  return out;
}

/** One SVG path for a sprite at (ox, oy): a 1 × 1 square per lit cell. */
export function spritePath(rows: readonly string[], ox = 0, oy = 0): string {
  return litCells(rows)
    .map(([x, y]) => `M${ox + x} ${oy + y}h1v1h-1z`)
    .join("");
}
