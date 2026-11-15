/**
 * Shares the admin's unsaved edits with the preview tab, in the same browser
 * only. The draft sits in localStorage; other tabs hear about every change
 * through the browser's "storage" event.
 */

import type { SiteContent } from "@/lib/site/schema";

export const DRAFT_KEY = "hs-admin-draft";

export function publishDraft(draft: SiteContent): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/** For useSyncExternalStore: the raw draft text (a string compares cheaply between renders). */
export function draftSnapshot(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

export function subscribeDraft(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === DRAFT_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
