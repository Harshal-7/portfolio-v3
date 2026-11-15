"use client";

import { useEffect, useRef, useState } from "react";

import { useCuriousBulb } from "../shared/curious-bulb";
import { bulbLabel, setMode, useMode } from "../shared/mode";

/** An Edison bulb on a cord, with a pull string beside it. Lit = light theme. */
export function PullCordBulb() {
  const mode = useMode();
  const [pulling, setPulling] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const bulbRef = useRef<HTMLButtonElement>(null);
  const curious = useCuriousBulb(bulbRef);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const label = bulbLabel(mode);
  return (
    <button
      ref={bulbRef}
      data-near={curious.near || undefined}
      data-nudge={curious.nudge || undefined}
      type="button"
      className="nb-bulb"
      aria-label={label}
      title={label}
      data-pulling={pulling || undefined}
      onClick={() => {
        curious.stopNudge();
        const current = document.documentElement.getAttribute("data-mode");
        setMode(current === "dark" ? "light" : "dark");
        setPulling(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setPulling(false), 240);
      }}
    >
      <span aria-hidden="true" className="nb-bulb-hang">
        <span className="nb-cord" />
        <span className="nb-cap" />
        <svg className="nb-glass-svg" width="26" height="34" viewBox="0 0 26 34">
          <path
            className="nb-glass"
            d="M8 0H18V5C18 7 19.5 8.6 21.2 10.3A12 12 0 1 1 4.8 10.3C6.5 8.6 8 7 8 5Z"
          />
          <path className="nb-filament" d="M10.5 6V14L13 17L15.5 14V6" />
        </svg>
      </span>
      <span aria-hidden="true" className="nb-pull">
        <span className="nb-string" />
        <span className="nb-handle" />
      </span>
    </button>
  );
}
