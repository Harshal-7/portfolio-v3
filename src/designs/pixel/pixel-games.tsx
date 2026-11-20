import type { CSSProperties } from "react";

import type { Game } from "@/lib/site/schema";
import { newTab } from "@/lib/site/view";

import {
  BOARD,
  HEART_SPRITE,
  KNIGHT_LOOP,
  KNIGHT_SPRITE,
  PLAYER_SPRITE,
  QUESTION_SPRITE,
  spritePath,
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

/** Three lives and a blinking prompt beside the Arcade heading. */
export function ArcadeHud() {
  const hearts = [0, 8, 16].map((x) => spritePath(HEART_SPRITE, x, 0)).join("");
  return (
    <span aria-hidden="true" className="px-hud">
      <svg viewBox="0 0 23 6" className="px-hearts">
        <path d={hearts} />
      </svg>
      <span className="px-start">PRESS START</span>
    </span>
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
