import type { CSSProperties } from "react";

import type { Game } from "@/lib/site/schema";
import { gamesSite, newTab } from "@/lib/site/view";

import {
  ARCHER_SPRITE,
  ARROW_SPRITE,
  BOARD,
  BOW_SPRITE,
  cellsPath,
  CRACKER_BANDS,
  CRACKER_BODY,
  CRACKER_SHINE,
  HAT_SPRITE,
  HOUSE_LOW,
  HOUSE_TALL,
  KNIGHT_LOOP,
  KNIGHT_SPRITE,
  LEGS_STRIDE,
  LEGS_TOGETHER,
  MOON_SPRITE,
  PLAYER_SPRITE,
  QUESTION_SPRITE,
  ringCells,
  SLEEPER_SPRITE,
  SPARK_CROSS,
  SPARK_PLUS,
  spritePath,
  SUN_SPRITE,
  TARGET_SPRITE,
  Z_SPRITE,
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
 * from the very first frame only one knight shows.
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
          className="ps-trail"
          style={hopTiming(i)}
        />
      ))}
      <g>
        {KNIGHT_LOOP.map(([c, r], i) => (
          <path key={i} d={spritePath(KNIGHT_SPRITE, c * SQ + 1, r * SQ + 1)} className="ps-knight" style={hopTiming(i)} />
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
            <g className="ps-card" style={cardTiming(i)}>
              <g className="ps-back" style={cardTiming(i)}>
                <rect x={x} y={y} width={7} height={8} className="ps-back-edge" />
                <rect x={x + 1} y={y + 1} width={5} height={6} className="ps-back-fill" />
              </g>
              <g className="ps-face" style={cardTiming(i)}>
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
              className={odd ? "ps-player ps-imposter" : "ps-player"}
              style={odd ? cardTiming(i) : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Mafia: three friends asleep in a night town. A pair of red eyes opens in a
// dark window, then dawn breaks and everyone wakes up. pixel.css times it.
const SLEEPERS = [6, 18, 30];
const STARS_A: [number, number][] = [[14, 3], [30, 6], [44, 2], [58, 4], [76, 2]];
const STARS_B: [number, number][] = [[22, 2], [38, 5], [50, 7], [64, 3]];

function MafiaScreen() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ps-svg" aria-hidden="true">
      <rect width={W} height={H} className="pm-sky" />
      <g className="pm-night">
        <path d={cellsPath(STARS_A)} className="pm-star pm-star-a" />
        <path d={cellsPath(STARS_B)} className="pm-star pm-star-b" />
        <path d={spritePath(MOON_SPRITE, 4, 2)} className="pm-moon" />
      </g>
      <path d={spritePath(SUN_SPRITE, 40, 21)} className="pm-sun pm-day" />
      <path d={spritePath(HOUSE_LOW, 52, 13)} className="pm-house" />
      <path d={spritePath(HOUSE_TALL, 65, 8)} className="pm-house-tall" />
      <rect x={56} y={17} width={3} height={2} className="pm-lamp" />
      <rect x={68} y={13} width={5} height={3} className="pm-window" />
      <path d={cellsPath([[69, 14], [71, 14]])} className="pm-eyes" />
      <path d={`M0 24h${W}v1h-${W}z`} className="pm-ground" />
      <g className="pm-night">
        {SLEEPERS.map((x, i) => (
          <g key={x}>
            <path d={spritePath(SLEEPER_SPRITE, x, 16)} className="pm-person" />
            <path
              d={spritePath(Z_SPRITE, x + 5, 12)}
              className="pm-z"
              style={{ animationDelay: `${(i * 0.8).toFixed(1)}s` }}
            />
          </g>
        ))}
      </g>
      <g className="pm-day">
        {SLEEPERS.map((x) => (
          <path key={x} d={spritePath(PLAYER_SPRITE, x, 16)} className="pm-person" />
        ))}
      </g>
      <rect width={W} height={H} className="pm-dawn" />
    </svg>
  );
}

// Patakha: a spark runs down the fuse into the firecracker, it bursts, and a
// fresh one is set down. The fuse is straight, so one cover rectangle growing
// from the tip hides the burnt part; pixel.css steps it with the spark.
const FUSE_X = 34;
const FUSE_LEN = 16;
const FUSE_Y = 14;
const CRACKER_X = FUSE_X + FUSE_LEN;
const CRACKER_Y = 11;
const BURST = { x: CRACKER_X + 3, y: CRACKER_Y + 6 };
const ringA = ringCells(BURST.x, BURST.y, 7, 12);

function PatakhaScreen() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ps-svg" aria-hidden="true">
      <rect width={W} height={H} className="ps-sq-a" />
      <path d={`M6 24h${W - 12}v1h-${W - 12}z`} className="ps-ground" />
      <path d={`M${FUSE_X} ${FUSE_Y}h${FUSE_LEN}v1h-${FUSE_LEN}zM${FUSE_X} ${FUSE_Y - 1}h1v1h-1z`} className="pp-fuse" />
      {/* One pixel larger than the fuse all round, so no sliver shows at odd screen sizes. */}
      <rect x={FUSE_X - 1} y={FUSE_Y - 2} width={FUSE_LEN + 1} height={4} className="pp-burnt" />
      <g className="pp-cracker">
        <path d={spritePath(CRACKER_BODY, CRACKER_X, CRACKER_Y)} className="pp-body" />
        <path d={spritePath(CRACKER_BANDS, CRACKER_X, CRACKER_Y)} className="pp-band" />
        <path d={spritePath(CRACKER_SHINE, CRACKER_X, CRACKER_Y)} className="pp-shine" />
      </g>
      <g className="pp-spark">
        <g className="pp-spark-move">
          <path d={spritePath(SPARK_PLUS, FUSE_X - 1, FUSE_Y - 1)} className="pp-spark-a" />
          <path d={spritePath(SPARK_CROSS, FUSE_X - 1, FUSE_Y - 1)} className="pp-spark-b" />
        </g>
      </g>
      <path d={cellsPath(ringCells(BURST.x, BURST.y, 3, 8))} className="pp-burst pp-burst-1" />
      <path d={cellsPath(ringA.filter((_, i) => i % 2 === 0))} className="pp-burst pp-burst-2 pp-gold" />
      <path d={cellsPath(ringA.filter((_, i) => i % 2 === 1))} className="pp-burst pp-burst-2 pp-orange" />
      <path d={cellsPath(ringCells(BURST.x, BURST.y, 10, 12, 0.5))} className="pp-burst pp-burst-3" />
      <rect width={W} height={H} className="pp-flash" />
    </svg>
  );
}

const SCREENS = { knight: KnightScreen, imposter: ImposterScreen, mafia: MafiaScreen, patakha: PatakhaScreen } as const;

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
 * arcade screen that plays all the time, then a link to the rest.
 */
export function PixelGames({ games }: { games: Game[] }) {
  const more = gamesSite(games);
  return (
    <>
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
      {more && (
        <a href={more.href} {...newTab(more.href)} className="px-more">
          More games at {more.host} <span aria-hidden="true" className="px-tri" />
        </a>
      )}
    </>
  );
}
