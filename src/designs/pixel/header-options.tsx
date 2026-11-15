import "./header-options.css";

/** Candidate headers for the Pixel design, compared on the local /lab page. */

// The pixel "HS": 5 × 7 letters with a one-cell gap.
const H = ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"];
const S = [".XXXX", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."];
const ROWS = H.map((h, r) => `${h}.${S[r]}`);

/** The pixel HS block. Pops in cell by cell on load and on every theme switch. */
export function PixelMark({ cell = 4, title }: { cell?: number; title?: string }) {
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="hd-mark"
      style={{ gridTemplateColumns: `repeat(11, ${cell}px)`, gridAutoRows: `${cell}px` }}
    >
      {ROWS.join("")
        .split("")
        .map((ch, i) => {
          const r = Math.floor(i / 11);
          const c = i % 11;
          if (ch !== "X") return <span key={i} />;
          return (
            <span
              key={i}
              className={`px-pop ${c < 5 ? "hd-mark-h" : "hd-mark-s"}`}
              style={{ animationDelay: `${((r + c) * 0.03).toFixed(2)}s` }}
            />
          );
        })}
    </span>
  );
}

/** The same mark as a small SVG, for the browser tab icon. */
export function PixelMarkSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="13" height="13" rx="2" fill="#fbfbfa" />
      {ROWS.flatMap((row, r) =>
        row.split("").map((ch, c) =>
          ch === "X" ? <rect key={`${r}-${c}`} x={c + 1} y={r + 3} width="1" height="1" fill={c < 5 ? "#18181b" : "#4f46e5"} /> : null,
        ),
      )}
    </svg>
  );
}

/** 1 · Current: small badge and full name. */
export function HeaderBadgeName({ name }: { name: string }) {
  return (
    <>
      <span aria-hidden="true" className="px-badge">
        HS
      </span>
      <span className="px-name">{name}</span>
    </>
  );
}

/** 2 · The pixel HS block on its own. */
export function HeaderMark() {
  return <PixelMark cell={4} title="Harshal Shinde" />;
}

/** 3 · Pixel HS block plus the domain wordmark. */
export function HeaderMarkWordmark() {
  return (
    <>
      <PixelMark cell={3} />
      <span className="hd-word">
        huhharshal<span className="hd-tld">.com</span>
      </span>
    </>
  );
}

/** 4 · Wordmark only: "huh·harshal" with a blinking pixel cursor. */
export function HeaderWordmark() {
  return (
    <span className="hd-word hd-word-lg" aria-label="huhharshal">
      <span aria-hidden="true">
        <span className="hd-huh">huh</span>
        <span className="hd-dot">·</span>harshal
        <span className="hd-cursor" />
      </span>
    </span>
  );
}
