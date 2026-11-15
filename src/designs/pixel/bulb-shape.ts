/**
 * The 9 × 12 pixel bulb, shared by the live bulb and the link-preview image.
 * X glass, H highlight, B/b screw base, . empty.
 */
export const BULB_ROWS = [
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
] as const;
