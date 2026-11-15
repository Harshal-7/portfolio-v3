/**
 * Pressing H twice quickly on the public site opens /admin (H for Harshal).
 * No Cmd/Ctrl/Alt, so it can't clash with browser or system shortcuts:
 * Cmd + H hides the browser on a Mac, and Ctrl + H opens history on Windows.
 */

export const DOUBLE_PRESS_MS = 500;

type KeyInfo = Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "code" | "repeat">;

/** Returns a handler that is true on the second plain H press within DOUBLE_PRESS_MS. */
export function createAdminShortcut(): (e: KeyInfo, now: number) => boolean {
  let lastH = -Infinity;
  return (e, now) => {
    const plainH = e.code === "KeyH" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !e.repeat;
    if (!plainH) {
      lastH = -Infinity;
      return false;
    }
    if (now - lastH <= DOUBLE_PRESS_MS) {
      lastH = -Infinity;
      return true;
    }
    lastH = now;
    return false;
  };
}
