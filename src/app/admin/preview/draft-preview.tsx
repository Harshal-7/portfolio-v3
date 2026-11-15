"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { NotebookSite } from "@/designs/notebook/notebook-site";
import { PixelSite } from "@/designs/pixel/pixel-site";
import { contentOf, contentSchema, DESIGNS, type Design, type SiteContent, type SiteDoc } from "@/lib/site/schema";

import "../admin.css";
import { draftSnapshot, subscribeDraft } from "../draft-channel";

type Draft = { content: SiteContent | null; invalid: boolean };

function parseDraft(text: string | null): Draft {
  if (!text) return { content: null, invalid: false };
  try {
    // Only drafts that pass the same checks as saving are shown, so a half-typed
    // link can never become a javascript: href, even in the preview.
    const result = contentSchema.safeParse(JSON.parse(text));
    return result.success ? { content: result.data, invalid: false } : { content: null, invalid: true };
  } catch {
    return { content: null, invalid: true };
  }
}

/** Renders either design with the latest draft, updating as the admin types. */
export function DraftPreview({ saved }: { saved: SiteDoc }) {
  const text = useSyncExternalStore(subscribeDraft, draftSnapshot, () => null);
  const { content, invalid } = useMemo(() => parseDraft(text), [text]);
  // While a field is mid-edit and invalid, keep showing the last valid draft.
  const [lastValid, setLastValid] = useState<SiteContent | null>(null);
  if (content && content !== lastValid) setLastValid(content);
  const asked = useSearchParams().get("design");
  const forced = (DESIGNS as readonly string[]).includes(asked ?? "") ? (asked as Design) : null;

  const savedContent = contentOf(saved);
  const shown = content ?? lastValid ?? savedContent;
  const doc: SiteDoc = { ...saved, ...shown, design: forced ?? shown.design };
  const unsaved = JSON.stringify(shown) !== JSON.stringify(savedContent);

  const note = invalid
    ? "Preview paused · some fields aren’t valid yet"
    : unsaved
      ? "Live preview · unsaved changes"
      : "Preview · same as the live site";

  return (
    <>
      <p className="fixed bottom-3 left-1/2 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 truncate rounded-full bg-btn px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-btn-fg shadow-lg">
        <span className="pp-light shrink-0" data-status={invalid ? "error" : unsaved ? "checking" : "ok"} aria-hidden="true" />
        <span className="truncate">
          {note} · {doc.design}
        </span>
      </p>
      {doc.design === "pixel" ? <PixelSite site={doc} /> : <NotebookSite site={doc} />}
    </>
  );
}
