import { describe, expect, it } from "vitest";

import { layoutBoard } from "./pixel-board";
import { glyph } from "./pixel-font";

describe("pixel board", () => {
  it("draws HS like the pixel mark: 32 lit cells, 7 rows tall", () => {
    const { cells } = layoutBoard([{ text: "HS", tone: "fg" }]);
    expect(cells).toHaveLength(32);
    expect(new Set(cells.map((c) => c.y)).size).toBe(7);
  });

  it("treats lowercase like uppercase and unknown characters as spaces", () => {
    expect(glyph("a")).toEqual(glyph("A"));
    expect(glyph("€")).toEqual(glyph(" "));
    expect(glyph("’")).toEqual(glyph("'"));
  });

  it("gives every glyph 7 rows of equal width", () => {
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 +-/.,!?&':()_◆") {
      const rows = glyph(ch);
      expect(rows, ch).toHaveLength(7);
      expect(new Set(rows.map((r) => r.length)).size, ch).toBe(1);
    }
  });
});
