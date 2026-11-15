"use client";

import { useEffect, useState } from "react";

import { splitTicker } from "@/lib/site/view";

import "./ticker-options.css";

/**
 * Candidate styles for the Pixel design's "now building" strip. Shown side by
 * side on the local /lab page; the chosen one replaces the LED marquee.
 */

function useCycle(count: number, ms: number): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [count, ms]);
  return count ? i % count : 0;
}

// ---------------------------------------------------------------------------
// A · LED marquee (current)

export function LedTicker({ text }: { text: string }) {
  return (
    <div className="px-ticker" role="marquee" aria-label={text}>
      <div className="px-marquee" aria-hidden="true">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B · Hotbar (Minecraft): an inventory bar; the selected slot moves along and
// the item name pops up above it, like switching items in the game.

type Icon = { rows: string[]; colors: Record<string, string> };
const ICONS: Icon[] = [
  {
    // diamond
    rows: ["..XXXX..", ".XHHXXX.", "XHXXXXXX", "XXXXXXXX", ".XXXXXX.", "..XXXX..", "...XX...", "........"],
    colors: { X: "#4fe3d8", H: "#d6fffb" },
  },
  {
    // book
    rows: [".BBBBBB.", "BPPPPPPB", "BPLLLLPB", "BPPPPPPB", "BPLLLLPB", "BPPPPPPB", ".BBBBBB.", "........"],
    colors: { B: "#8b5a2b", P: "#efe6cc", L: "#9c8b6a" },
  },
  {
    // emerald
    rows: ["...XX...", "..XHXX..", ".XHXXXX.", ".XXXXXX.", ".XXXXXX.", "..XXXX..", "...XX...", "........"],
    colors: { X: "#2fbf5f", H: "#b9f7cb" },
  },
  {
    // redstone dust
    rows: ["........", "..R..R..", ".RRRRRR.", "..RDDR..", ".RRDDRR.", "..R..R..", "........", "........"],
    colors: { R: "#e0352b", D: "#8f1410" },
  },
];

function PixelIcon({ icon }: { icon: Icon }) {
  return (
    <span className="tk-icon" aria-hidden="true">
      {icon.rows.join("").split("").map((c, i) => (
        <span key={i} style={c === "." ? undefined : { background: icon.colors[c] }} />
      ))}
    </span>
  );
}

export function HotbarTicker({ text }: { text: string }) {
  const phrases = splitTicker(text);
  const active = useCycle(phrases.length, 2600);
  return (
    <div className="tk-hotbar" role="marquee" aria-label={phrases.join(". ")}>
      <p key={active} className="tk-hot-name" aria-hidden="true">
        {phrases[active]}
      </p>
      <div className="tk-hot-row" aria-hidden="true">
        {Array.from({ length: 9 }, (_, slot) => (
          <span key={slot} className={slot === active ? "tk-slot is-on" : "tk-slot"}>
            {slot < phrases.length && <PixelIcon icon={ICONS[slot % ICONS.length]} />}
            {slot < phrases.length && <span className="tk-slot-n">{slot + 1}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C · Splash text (Minecraft title screen): tilted yellow text that pulses,
// with a new line every few seconds.

export function SplashTicker({ text }: { text: string }) {
  const phrases = splitTicker(text);
  const active = useCycle(phrases.length, 3000);
  return (
    <div className="tk-splash-wrap" role="marquee" aria-label={phrases.join(". ")}>
      <span key={active} className="tk-splash" aria-hidden="true">
        {phrases[active]}!
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D · Terminal (futuristic): a small console that types each line, waits,
// then deletes it.

function useTypewriter(phrases: string[]): string {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (phrases.length === 0) return;
    let index = 0;
    let length = 0;
    let deleting = false;
    let timer = 0;
    const step = () => {
      const phrase = phrases[index];
      if (!deleting && length < phrase.length) {
        length += 1;
        timer = window.setTimeout(step, 45);
      } else if (!deleting) {
        deleting = true;
        timer = window.setTimeout(step, 1600);
      } else if (length > 0) {
        length -= 1;
        timer = window.setTimeout(step, 18);
      } else {
        deleting = false;
        index = (index + 1) % phrases.length;
        timer = window.setTimeout(step, 350);
      }
      setShown(phrases[index].slice(0, length));
    };
    timer = window.setTimeout(step, 400);
    return () => window.clearTimeout(timer);
  }, [phrases]);
  return shown;
}

export function TerminalTicker({ text }: { text: string }) {
  const [phrases] = useState(() => splitTicker(text).map((p) => p.toLowerCase()));
  const shown = useTypewriter(phrases);
  return (
    <div className="tk-term" role="marquee" aria-label={phrases.join(". ")}>
      <div className="tk-term-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <em>~/harshal — status</em>
      </div>
      <p className="tk-term-line" aria-hidden="true">
        <span className="tk-term-prompt">$</span> {shown}
        <span className="tk-term-cursor" />
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// E · Split-flap board (retro-futuristic): airport departure-board letters that
// flip to the next line.

export function FlapTicker({ text }: { text: string }) {
  const phrases = splitTicker(text).map((p) => p.toUpperCase());
  const active = useCycle(phrases.length, 3400);
  const words = (phrases[active] ?? "").split(/\s+/);
  let n = 0;
  const cells = words.map((word) =>
    word.split("").map((ch) => ({ ch, delay: n++ * 0.03 })),
  );
  return (
    <div className="tk-board" role="marquee" aria-label={phrases.join(". ")}>
      <div key={active} className="tk-board-row" aria-hidden="true">
        {cells.map((word, wi) => (
          <span key={wi} className="tk-board-word">
            {word.map((c, ci) => (
              <span key={ci} className="tk-flap" style={{ animationDelay: `${c.delay}s` }}>
                {c.ch}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
