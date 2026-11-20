import type { CSSProperties } from "react";

import type { Game } from "@/lib/site/schema";
import { gamesSite, newTab } from "@/lib/site/view";

import { BOARD, KNIGHT_ROUTE } from "../shared/game-art";

// Drawings are 144 × 54: the board strip with 18-unit squares.
const SQ = 18;
const W = BOARD.cols * SQ;
const H = BOARD.rows * SQ;

const center = ([c, r]: readonly [number, number]) => [c * SQ + SQ / 2, r * SQ + SQ / 2] as const;

const darkSquares = Array.from({ length: BOARD.cols * BOARD.rows }, (_, n) => [n % BOARD.cols, Math.floor(n / BOARD.cols)])
  .filter(([c, r]) => (c + r) % 2 === 1)
  .map(([c, r]) => `M${c * SQ} ${r * SQ}h${SQ}v${SQ}h-${SQ}z`)
  .join("");

/** A chess knight facing left, in a 16 × 18 box, with its eye. */
const KNIGHT_SHAPE =
  "M2 18H14V16H12.6C13.6 13 13.8 10 13.2 7.5C12.7 5 11.6 3.3 10.2 2.4L9.6 0.2L8 2C5.6 2.4 3.4 4.4 2.1 6.9L1 9.4C0.8 9.9 1.2 10.6 1.8 10.7L3 10.9C3.8 11 4.6 10.6 5.3 10.2L6.8 9.9C5.6 11.4 4.6 13.5 4.6 16H2Z";
const KNIGHT_EYE = { cx: 7.2, cy: 5.6, r: 0.9 };

/** The knight's route in pen, from a ring at the start to the knight at the end. */
function KnightDrawing() {
  const points = KNIGHT_ROUTE.map(center);
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="nb-game-svg" aria-hidden="true">
      <path d={darkSquares} className="nb-art-dark" />
      <rect x={0} y={0} width={W} height={H} rx={2} className="nb-art-edge" />
      <polyline points={points.map((p) => p.join(",")).join(" ")} pathLength={1} className="nb-art-path" />
      <circle cx={sx} cy={sy} r={3.2} className="nb-art-start" />
      <g className="nb-art-knight">
        <g transform={`translate(${ex - 8} ${ey - 9.5})`}>
          <path d={KNIGHT_SHAPE} />
          <circle {...KNIGHT_EYE} className="nb-art-eye" />
        </g>
      </g>
    </svg>
  );
}

/** Four friends with a card each; the third card is a question mark. */
function ImposterDrawing() {
  const xs = [27, 57, 87, 117];
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="nb-game-svg" aria-hidden="true">
      {xs.map((x, i) => {
        const odd = i === 2;
        const draw = { animationDelay: `${(i * 0.15).toFixed(2)}s` } as CSSProperties;
        return (
          <g key={x} className={odd ? "nb-art-imposter" : undefined}>
            <rect x={x - 8} y={3} width={16} height={13} rx={2.5} className={odd ? "nb-art-line nb-art-odd" : "nb-art-line"} />
            {odd ? (
              <text x={x} y={13.6} className="nb-art-q">
                ?
              </text>
            ) : (
              <>
                <line x1={x - 4.5} y1={7.8} x2={x + 4.5} y2={7.8} pathLength={1} className="nb-art-word" style={draw} />
                <line x1={x - 4.5} y1={11.4} x2={x + 1.5} y2={11.4} pathLength={1} className="nb-art-word" style={draw} />
              </>
            )}
            <circle cx={x} cy={28} r={6} className="nb-art-line" />
            <path d={`M${x - 11} ${H}C${x - 11} 43 ${x - 6} 38.5 ${x} 38.5C${x + 6} 38.5 ${x + 11} 43 ${x + 11} ${H}`} className="nb-art-line" />
          </g>
        );
      })}
    </svg>
  );
}

/** A firecracker whose curly fuse burns down from the tip, then rays burst from its top. */
const RAYS = Array.from({ length: 7 }, (_, k) => {
  const a = ((-165 + k * 25) * Math.PI) / 180;
  const p = (r: number) => `${(104 + r * Math.cos(a)).toFixed(1)} ${(15 + r * Math.sin(a)).toFixed(1)}`;
  return `M${p(6)}L${p(13)}`;
});

function PatakhaDrawing() {
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="nb-game-svg" aria-hidden="true">
      <g className="nb-art-cracker">
        <path d="M99 20V16.5H109V20" className="nb-art-line" />
        <rect x={96} y={20} width={16} height={33} rx={3} className="nb-art-line" />
        <path d="M96 29H112M96 44H112" className="nb-art-band" />
      </g>
      <path
        d="M104 16.5C104 8 96 5 90 10S78 20 70 13S58 4 47 10"
        pathLength={1}
        className="nb-art-fuse"
      />
      <path d="M47 3.5v3M47 13.5v3M40.5 10h3M50.5 10h3M42.5 5.5l2 2M51.5 5.5l-2 2M42.5 14.5l2-2M51.5 14.5l-2-2" className="nb-art-spark" />
      {RAYS.map((d, i) => (
        <path key={i} d={d} pathLength={1} className="nb-art-ray" />
      ))}
    </svg>
  );
}

/** A night town: three friends asleep, and two eyes blinking in a dark window. */
function MafiaDrawing() {
  const sleepers = [18, 41, 64];
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="nb-game-svg" aria-hidden="true">
      <path d="M21 3A9 9 0 1 0 29 17A7 7 0 1 1 21 3Z" className="nb-art-line" />
      <path d="M42 6v4M40 8h4M60 3v4M58 5h4M79 9v4M77 11h4" className="nb-art-band" />
      <path d="M86 53V34L98 24L110 34V53" className="nb-art-line" />
      <rect x={94} y={39} width={8} height={7} rx={1.5} className="nb-art-line" />
      <path d="M112 53V28L126 16L140 28V53" className="nb-art-line" />
      <rect x={119} y={33} width={14} height={9} rx={1.5} className="nb-art-line" />
      <g className="nb-art-eyes">
        <circle cx={123.5} cy={37.5} r={1.3} />
        <circle cx={128.5} cy={37.5} r={1.3} />
      </g>
      {sleepers.map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={38} r={5} className="nb-art-line" />
          <path d={`M${x - 9} ${H}C${x - 9} 48 ${x - 5} 45.5 ${x} 45.5C${x + 5} 45.5 ${x + 9} 48 ${x + 9} ${H}`} className="nb-art-line" />
          <text x={x + 7} y={30} className="nb-art-z" style={{ animationDelay: `${(i * 0.9).toFixed(1)}s` }}>
            z
          </text>
        </g>
      ))}
    </svg>
  );
}

const DRAWINGS = { knight: KnightDrawing, imposter: ImposterDrawing, mafia: MafiaDrawing, patakha: PatakhaDrawing } as const;

/** Notebook's game cards: small tiles with a pen drawing that keeps redrawing, then a link to the rest. */
export function NotebookGames({ games }: { games: Game[] }) {
  const more = gamesSite(games);
  return (
    <>
      <div className="nb-games">
        {games.map((g, i) => {
          const Drawing = g.art === "none" ? null : DRAWINGS[g.art];
          const inner = (
            <>
              {Drawing && (
                <div className="nb-game-art">
                  <Drawing />
                </div>
              )}
              <div className="nb-game-body">
                <div className="nb-game-top">
                  <h3 className="nb-game-name">{g.name}</h3>
                  {(g.meta || g.href) && (
                    <span className="nb-game-kind">
                      {g.meta}
                      {g.href && (
                        <span aria-hidden="true" className="nb-arrow">
                          ↗
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {g.what && <p className="nb-game-one">{g.what}</p>}
              </div>
            </>
          );
          return g.href ? (
            <a key={`${i}-${g.name}`} href={g.href} {...newTab(g.href)} className="nb-game hs-lift">
              {inner}
            </a>
          ) : (
            <div key={`${i}-${g.name}`} className="nb-game">
              {inner}
            </div>
          );
        })}
      </div>
      {more && (
        <a href={more.href} {...newTab(more.href)} className="nb-more">
          More games at {more.host}
          <span aria-hidden="true" className="nb-arrow">
            ↗
          </span>
        </a>
      )}
    </>
  );
}
