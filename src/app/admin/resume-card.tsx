"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useRef, useState } from "react";

import type { Resume } from "@/lib/site/schema";

import { finishResumeUpload, type SaveResult } from "./actions";
import { Card, formatSize, ghostButton, Icon, LocalTime } from "./admin-ui";

export function ResumeCard(props: {
  resume: Resume | null;
  rev: number;
  blobReady: boolean;
  busy: boolean;
  onResult: (result: SaveResult, okText: string) => void;
  onRemove: () => void;
  ensureUnlocked: () => Promise<boolean>;
}) {
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const disabled = uploading || props.busy || !props.blobReady;

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      props.onResult({ ok: false, error: "Choose a PDF file." }, "");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      props.onResult({ ok: false, error: "The PDF is over 5 MB. Export a smaller one and try again." }, "");
      return;
    }
    setUploading(true);
    try {
      if (!(await props.ensureUnlocked())) {
        props.onResult({ ok: false, error: "Not uploaded. Changes need the save password." }, "");
        return;
      }
      const name = file.name.replace(/\.pdf$/i, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
      // A random part keeps every upload at a new path, so an old file is never overwritten.
      const suffix = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("");
      const blob = await uploadPresigned(`resume/${name || "resume"}-${suffix}.pdf`, file, {
        access: "private",
        handleUploadUrl: "/admin/upload",
        contentType: "application/pdf",
      });
      props.onResult(await finishResumeUpload(props.rev, blob.url), "Résumé updated. The Résumé link now opens the new PDF.");
    } catch (error) {
      props.onResult({ ok: false, error: error instanceof Error ? error.message : "The upload failed." }, "");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Card
      title="Résumé"
      aside={
        <a href="/resume" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-link">
          /resume <Icon name="external" className="size-3.5" />
        </a>
      }
    >
      <div className="flex items-center gap-3.5 rounded-xl border border-line bg-bg p-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent-soft text-link">
          <Icon name="file" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          {props.resume ? (
            <>
              <span className="block truncate text-sm font-medium">{props.resume.pathname.split("/").pop()}</span>
              <span className="block text-xs text-muted">
                {formatSize(props.resume.size)} · <LocalTime iso={props.resume.uploadedAt} dateOnly />
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium">No PDF yet</span>
              <span className="block text-xs text-muted">/resume shows a “coming soon” note</span>
            </>
          )}
        </span>
        {props.resume && (
          <button
            type="button"
            onClick={props.onRemove}
            disabled={disabled}
            aria-label="Remove résumé"
            title="Remove"
            className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-30"
          >
            <Icon name="trash" />
          </button>
        )}
      </div>
      {props.blobReady ? (
        <label className={`${ghostButton} w-full cursor-pointer ${disabled ? "pointer-events-none opacity-50" : ""}`}>
          <Icon name="upload" />
          {uploading ? "Uploading…" : props.resume ? "Replace PDF" : "Upload PDF"}
          <span className="font-normal text-muted">· up to 5 MB</span>
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
      ) : (
        <p className="text-center text-xs text-muted">Uploads work once a Blob store is connected in Vercel.</p>
      )}
    </Card>
  );
}
