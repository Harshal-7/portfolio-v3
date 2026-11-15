"use client";

import { bulbLabel, setMode, useMode } from "../shared/mode";

// 9 × 12 pixel bulb. X glass, H highlight, B/b screw base, . empty.
const ROWS = [
  "..XXXXX..",
  ".XXXXXXX.",
  "XXHHXXXXX",
  "XXHXXXXXX",
  "XXXXXXXXX",
  "XXXXXXXXX",
  ".XXXXXXX.",
  "..XXXXX..",
  "...BBB...",
  "...bbb...",
  "...BBB...",
  "....B....",
];
const CELLS = ROWS.join("").split("");
const PARTICLES = Array.from({ length: 10 }, (_, i) => i);

/**
 * A pixel bulb on a dashed cord. Pressing it bursts ten pixels outward; CSS
 * restarts the burst on every press by swapping the animation name per mode.
 */
export function PixelBulb() {
  const mode = useMode();
  const label = bulbLabel(mode);
  return (
    <button
      type="button"
      className="px-bulb"
      aria-label={label}
      title={label}
      onClick={() => {
        const current = document.documentElement.getAttribute("data-mode");
        setMode(current === "dark" ? "light" : "dark");
      }}
    >
      <span aria-hidden="true" className="px-cord" />
      <span aria-hidden="true" className="px-bulb-grid">
        {CELLS.map((c, i) => (
          <span key={i} className={c === "." ? undefined : `px-c-${c === "b" ? "s" : c}`} />
        ))}
        {PARTICLES.map((i) => (
          <span key={`p${i}`} className="px-pt" style={{ transform: `rotate(${i * 36 + 18}deg)` }}>
            <span className={i % 2 ? "px-pt-dot px-bf" : "px-pt-dot px-bn"} style={{ background: `var(--spark${(i % 4) + 1})` }} />
          </span>
        ))}
      </span>
    </button>
  );
}
