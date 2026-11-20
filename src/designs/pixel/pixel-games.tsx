import type { CSSProperties } from "react";

import type { Game } from "@/lib/site/schema";
import { newTab } from "@/lib/site/view";

import {
  ARCHER_SPRITE,
  ARROW_SPRITE,
  BOARD,
  BOW_SPRITE,
  HAT_SPRITE,
  KNIGHT_LOOP,
  KNIGHT_SPRITE,
  LEGS_STRIDE,
  LEGS_TOGETHER,
  PLAYER_SPRITE,
  QUESTION_SPRITE,
  spritePath,
  TARGET_SPRITE,
} from "../shared/game-art";

// Screens are 80 × 30 sprite pixels: the board strip, 10 pixels a square.
const SQ = 10;
const W = BOARD.cols * SQ;
const H = BOARD.rows * SQ;

// The keyframes in pixel.css give each square a tenth of the loop, so the loop
// has exactly 10 squares (a test checks this).
const HOP = 0.55;
const KNIGHT_SECONDS = HOP * KNIGHT_LOOP.length;

// Imposter: cards flip face up one after another, then back down.
const PLAYERS = 4;
const IMPOSTER = 2;
const CARD_STAGGER = 0.6;
const CARD_SECONDS = 6;

/**
 * Square i's part of the loop. Negative delays start each square mid-loop, so
 * a paused screen shows the knight on its first square, not on all of them.
 */
function hopTiming(i: number): CSSProperties {
  const delay = i === 0 ? 0 : i * HOP - KNIGHT_SECONDS;
  return { animationDuration: `${KNIGHT_SECONDS}s`, animationDelay: `${delay.toFixed(2)}s` };
}

function cardTiming(i: number): CSSProperties {
  return { animationDuration: `${CARD_SECONDS}s`, animationDelay: `${(i * CARD_STAGGER).toFixed(2)}s` };
}

const darkSquares = Array.from({ length: BOARD.cols * BOARD.rows }, (_, n) => [n % BOARD.cols, Math.floor(n / BOARD.cols)])
  .filter(([c, r]) => (c + r) % 2 === 1)
  .map(([c, r]) => `M${c * SQ} ${r * SQ}h${SQ}v${SQ}h-${SQ}z`)
  .join("");

/** The knight hops round its loop; the last two squares it left stay lit, as in the game. */
function KnightScreen() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ps-svg" aria-hidden="true">
      <rect width={W} height={H} className="ps-sq-a" />
      <path d={darkSquares} className="ps-sq-b" />
      {KNIGHT_LOOP.map(([c, r], i) => (
        <rect
          key={i}
          x={c * SQ + 1}
          y={r * SQ + 1}
          width={SQ - 2}
          height={SQ - 2}
          className="ps-trail px-anim"
          style={hopTiming(i)}
        />
      ))}
      <g>
        {KNIGHT_LOOP.map(([c, r], i) => (
          <path key={i} d={spritePath(KNIGHT_SPRITE, c * SQ + 1, r * SQ + 1)} className="ps-knight px-anim" style={hopTiming(i)} />
        ))}
      </g>
    </svg>
  );
}

/** Four players get a card each; one card says "?", and its owner starts to fidget. */
function ImposterScreen() {
  const width = PLAYERS * 7 + (PLAYERS - 1) * 5;
  const left = Math.floor((W - width) / 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ps-svg" aria-hidden="true">
      <rect width={W} height={H} className="ps-sq-a" />
      <path d={`M6 24h${W - 12}v1h-${W - 12}z`} className="ps-ground" />
      {Array.from({ length: PLAYERS }, (_, i) => {
        const x = left + i * 12;
        const y = 4;
        const odd = i === IMPOSTER;
        return (
          <g key={i}>
            <g className="ps-card px-anim" style={cardTiming(i)}>
              <g className="ps-back px-anim" style={cardTiming(i)}>
                <rect x={x} y={y} width={7} height={8} className="ps-back-edge" />
                <rect x={x + 1} y={y + 1} width={5} height={6} className="ps-back-fill" />
              </g>
              <g className="ps-face px-anim" style={cardTiming(i)}>
                <rect x={x} y={y} width={7} height={8} className="ps-face-bg" />
                {odd ? (
                  <path d={spritePath(QUESTION_SPRITE, x + 1, y + 1)} className="ps-q" />
                ) : (
                  <path d={`M${x + 1} ${y + 2}h5v1h-5zM${x + 1} ${y + 4}h3v1h-3zM${x + 1} ${y + 6}h4v1h-4z`} className="ps-word" />
                )}
              </g>
            </g>
            <path
              d={spritePath(PLAYER_SPRITE, x, 15)}
              className={odd ? "ps-player ps-imposter px-anim" : "ps-player"}
              style={odd ? cardTiming(i) : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}

const SCREENS = { knight: KnightScreen, imposter: ImposterScreen } as const;

// The archer's strip is 64 × 11 sprite pixels. The archer stops at x 14; the
// arrow sits on the bow at x 18 and sticks in the target at x 53. pixel.css
// moves the arrow by that 35 and walks the archer in from 22 pixels left.
const ARCHER_X = 14;
const ARCHER_Y = 0;
const ARROW_STUCK_X = 53;
const TARGET_X = 56;
const ground = Array.from({ length: 32 }, (_, i) => `M${i * 2} 10h1v1h-1z`).join("");

/**
 * Beside the Arcade heading: a little archer walks in, draws, shoots the
 * target, and blinks out before walking in again. Without motion, the archer
 * stands still with the arrow already in the target.
 */
export function ArcadeArcher() {
  return (
    <svg viewBox="0 0 64 11" className="px-archer" aria-hidden="true">
      <path d={ground} className="ar-ground" />
      <g className="ar-target">
        <path d={spritePath(TARGET_SPRITE, TARGET_X, 3)} className="ar-ring" />
        <path d={`M${TARGET_X + 2} 8h1v2h-1z`} className="ar-post" />
      </g>
      <path d={`M${TARGET_X + 2} 0h1v1h-1zM${TARGET_X + 1} 1h3v1h-3zM${TARGET_X + 2} 2h1v1h-1z`} className="ar-spark" />
      <g className="ar-blink">
        <g className="ar-walker">
          <path d={spritePath(HAT_SPRITE, ARCHER_X, ARCHER_Y)} className="ar-hat" />
          <path d={spritePath(ARCHER_SPRITE, ARCHER_X, ARCHER_Y)} className="ar-ink" />
          <path d={spritePath(BOW_SPRITE, ARCHER_X, ARCHER_Y)} className="ar-bow" />
          <path d={spritePath(LEGS_STRIDE, ARCHER_X, ARCHER_Y + 8)} className="ar-ink ar-stride" />
          <path d={spritePath(LEGS_TOGETHER, ARCHER_X, ARCHER_Y + 8)} className="ar-ink ar-feet" />
        </g>
        <path d={spritePath(ARROW_SPRITE, ARROW_STUCK_X, ARCHER_Y + 4)} className="ar-ink ar-arrow" />
      </g>
    </svg>
  );
}

/**
 * Pixel's game cards: smaller than the project cards, each with a little
 * arcade screen. The screen plays while the card is hovered or focused, and
 * all the time on touch screens.
 */
export function PixelGames({ games }: { games: Game[] }) {
  return (
    <div className="px-games">
      {games.map((g, i) => {
        const Screen = g.art === "none" ? null : SCREENS[g.art];
        const inner = (
          <>
            {Screen && (
              <div className="px-screen">
                <Screen />
              </div>
            )}
            <div className="px-game-body">
              <div className="px-game-top">
                <h3 className="px-game-name">{g.name}</h3>
                {g.meta && <span className="px-game-kind">{g.meta.toUpperCase()}</span>}
              </div>
              {g.what && <p className="px-game-one">{g.what}</p>}
              {g.href && (
                <span className="px-game-play">
                  <span className="px-keywrap">
                    <span className="px-key px-key-accent px-key-mini">
                      Play <span aria-hidden="true" className="px-tri" />
                    </span>
                  </span>
                </span>
              )}
            </div>
          </>
        );
        return g.href ? (
          <a key={`${i}-${g.name}`} href={g.href} {...newTab(g.href)} className="px-game">
            {inner}
          </a>
        ) : (
          <div key={`${i}-${g.name}`} className="px-game">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
