"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import { MODE_STORAGE_KEY } from "./theme";

export type Mode = "light" | "dark";

function readMode(): Mode | null {
  const m = document.documentElement.getAttribute("data-mode");
  return m === "light" || m === "dark" ? m : null;
}

/** The same logic as THEME_SCRIPT, for when data-mode goes missing after load. */
function applyStartMode(): void {
  const root = document.documentElement;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(MODE_STORAGE_KEY);
  } catch {}
  let mode = saved === "light" || saved === "dark" ? saved : root.getAttribute("data-default-mode");
  if (mode !== "light" && mode !== "dark") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.setAttribute("data-mode", mode);
  root.style.colorScheme = mode;
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => observer.disconnect();
}

/**
 * The current mode, or null on the server and during hydration. Styles never depend
 * on this (they key off html[data-mode]); it only feeds labels like aria-label.
 */
export function useMode(): Mode | null {
  const mode = useSyncExternalStore(subscribe, readMode, () => null);
  // If anything ever strips data-mode (React re-rendering <html> in dev, for one),
  // run the same start-up logic again so the page keeps a theme.
  useLayoutEffect(() => {
    if (!readMode()) applyStartMode();
  }, [mode]);
  return mode;
}

/** Switches the theme and remembers the choice for this browser. */
export function setMode(mode: Mode): void {
  const root = document.documentElement;
  root.setAttribute("data-mode", mode);
  // Lets CSS play the bulb animations only after a real press, not on page load.
  root.setAttribute("data-bulb", "1");
  root.style.colorScheme = mode;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // Private mode or blocked storage: the switch still works for this visit.
  }
}

export function bulbLabel(mode: Mode | null): string {
  if (mode === "dark") return "Turn the lights on (light theme)";
  if (mode === "light") return "Turn the lights off (dark theme)";
  return "Switch between light and dark theme";
}
