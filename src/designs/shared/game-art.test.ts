import { describe, expect, it } from "vitest";

import { BOARD, isKnightMove, KNIGHT_LOOP, KNIGHT_ROUTE, spritePath, type Square } from "./game-art";

function onBoardAndDistinct(squares: readonly Square[]) {
  for (const [c, r] of squares) {
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThan(BOARD.cols);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(BOARD.rows);
  }
  expect(new Set(squares.map((s) => s.join())).size).toBe(squares.length);
}

describe("knight routes", () => {
  it("the Pixel loop is 10 knight moves that close back on the start", () => {
    // pixel.css times the hops for exactly 10 squares.
    expect(KNIGHT_LOOP).toHaveLength(10);
    onBoardAndDistinct(KNIGHT_LOOP);
    KNIGHT_LOOP.forEach((sq, i) => expect(isKnightMove(sq, KNIGHT_LOOP[(i + 1) % KNIGHT_LOOP.length])).toBe(true));
  });

  it("the Notebook route is a chain of knight moves", () => {
    onBoardAndDistinct(KNIGHT_ROUTE);
    KNIGHT_ROUTE.slice(1).forEach((sq, i) => expect(isKnightMove(KNIGHT_ROUTE[i], sq)).toBe(true));
  });
});

describe("spritePath", () => {
  it("draws one square per lit cell", () => {
    expect(spritePath([".X", "X."], 10, 20)).toBe("M11 20h1v1h-1zM10 21h1v1h-1z");
  });
});
