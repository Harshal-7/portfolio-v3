"use server";

import { del, head } from "@vercel/blob";
import { ipAddress } from "@vercel/functions";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";

import { verifyPassword } from "@/lib/admin/password";
import { endSession, NotSignedInError, requireAdmin, startSession } from "@/lib/admin/session";
import { getAdminState } from "@/lib/admin/state";
import { defaultSite } from "@/lib/site/defaults";
import { SITE_TAG } from "@/lib/site/get-site";
import { orphanedResumeUrls } from "@/lib/site/history";
import { isOwnBlobUrl, looksLikePdf, RESUME_MAX_BYTES } from "@/lib/site/resume";
import { contentSchema, issueText, type Resume, type SiteDoc } from "@/lib/site/schema";
import { getStore, StoreNotConfiguredError, type WriteResult } from "@/lib/site/store";

// Never redirect to /admin from here: that address is a 404 by design.

export type LoginState = { error?: string; ok?: boolean };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const state = getAdminState();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!state || !hash) return { error: "Admin isn't set up yet. See the list above." };

  const ip = ipAddress(await headers()) ?? "unknown";
  let allowed: boolean;
  try {
    allowed = await state.allowLogin(ip);
  } catch (error) {
    console.error("[admin] rate limit check failed", error);
    return { error: "Couldn't reach storage. Try again in a minute." };
  }
  if (!allowed) return { error: "Too many tries. Wait 15 minutes, then try again." };

  const password = formData.get("password");
  if (typeof password !== "string" || !(await verifyPassword(password, hash))) {
    return { error: "That password isn't right." };
  }
  await startSession();
  return { ok: true };
}

export async function logout(): Promise<void> {
  await endSession();
}

export type SaveResult = { ok: true; doc: SiteDoc; canUndo: boolean } | { ok: false; error: string; issues?: string[] };

/** Runs an admin step, turning the usual failures into a message for the page. */
async function guarded(run: () => Promise<SaveResult>): Promise<SaveResult> {
  try {
    await requireAdmin();
    return await run();
  } catch (error) {
    if (error instanceof NotSignedInError || error instanceof StoreNotConfiguredError) {
      return { ok: false, error: error.message };
    }
    console.error("[admin] action failed", error);
    return { ok: false, error: "Something went wrong while saving. Nothing was changed." };
  }
}

const CONFLICT = "This page is out of date: the site was changed in another tab. Reload to get the latest, then redo your edit.";

/** After a save: refresh the public page, and delete résumé files nothing points to any more. */
async function finish(result: WriteResult): Promise<SaveResult> {
  if (!result.ok) {
    return { ok: false, error: result.reason === "empty" ? "There's nothing to undo." : CONFLICT };
  }
  updateTag(SITE_TAG);
  const store = getStore();
  const kept = await store.readAll();
  const orphans = orphanedResumeUrls(result.dropped, [kept.doc, ...kept.history].filter((d): d is SiteDoc => !!d));
  if (orphans.length > 0) {
    after(async () => {
      try {
        await del(orphans);
      } catch (error) {
        console.error("[admin] couldn't delete old résumé files", error);
      }
    });
  }
  return { ok: true, doc: result.doc, canUndo: kept.history.length > 0 };
}

async function writeNext(expectedRev: number, change: (current: SiteDoc) => SiteDoc): Promise<SaveResult> {
  const store = getStore();
  const stored = await store.read();
  const current = stored ?? defaultSite;
  if (current.rev !== expectedRev) return { ok: false, error: CONFLICT };
  const next: SiteDoc = { ...change(current), rev: expectedRev + 1, updatedAt: new Date().toISOString() };
  return finish(await store.write(next, expectedRev, stored ? undefined : defaultSite));
}

export async function saveContent(expectedRev: number, input: unknown): Promise<SaveResult> {
  return guarded(async () => {
    const parsed = contentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Some fields need fixing before this can be saved.",
        issues: parsed.error.issues.slice(0, 8).map(issueText),
      };
    }
    return writeNext(expectedRev, (current) => ({ ...current, ...parsed.data }));
  });
}

export async function undoLastSave(expectedRev: number): Promise<SaveResult> {
  return guarded(async () => finish(await getStore().undo(expectedRev, new Date().toISOString())));
}

export async function removeResume(expectedRev: number): Promise<SaveResult> {
  return guarded(() => writeNext(expectedRev, (current) => ({ ...current, resume: null })));
}

/**
 * Called by the admin page after the browser uploaded a PDF straight to Vercel
 * Blob. Checks the file really is a PDF on this site's store before using it.
 */
export async function finishResumeUpload(expectedRev: number, url: string): Promise<SaveResult> {
  return guarded(async () => {
    if (typeof url !== "string" || !isOwnBlobUrl(url)) return { ok: false, error: "That upload didn't come from this site's storage." };

    const reject = async (error: string): Promise<SaveResult> => {
      await del(url).catch(() => undefined);
      return { ok: false, error };
    };

    const info = await head(url);
    if (info.contentType !== "application/pdf") return reject("Only PDF files can be used as the résumé.");
    if (info.size > RESUME_MAX_BYTES) return reject("The PDF is over 5 MB. Export a smaller one and try again.");

    const response = await fetch(url, { headers: { Range: "bytes=0-7" }, cache: "no-store" });
    const firstBytes = new Uint8Array(await response.arrayBuffer());
    if (!looksLikePdf(firstBytes)) return reject("That file isn't a real PDF.");

    const resume: Resume = {
      url,
      pathname: info.pathname,
      size: info.size,
      uploadedAt: new Date(info.uploadedAt).toISOString(),
    };
    const result = await writeNext(expectedRev, (current) => ({ ...current, resume }));
    if (!result.ok) await del(url).catch(() => undefined);
    return result;
  });
}
