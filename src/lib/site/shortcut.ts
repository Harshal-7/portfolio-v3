/**
 * Ctrl + H opens /admin from the public site (H for Harshal). Cmd + H can't be
 * used: on a Mac it hides the browser before the page ever sees the key.
 */
export function isAdminShortcut(e: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "code">): boolean {
  return e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.code === "KeyH";
}
