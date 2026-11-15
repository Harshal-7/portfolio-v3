"use server";

import { del, get, head } from "@vercel/blob";
import { ipAddress } from "@vercel/functions";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";

import { verifyPassword } from "@/lib/admin/password";
import {
  endSession,
  isSavingUnlocked,
  NotSignedInError,
  requireAdmin,
  requireSavingUnlocked,
  SavingLockedError,
  startSession,
  unlockSavingForSession,
} from "@/lib/admin/session";
import { getAdminState } from "@/lib/admin/state";
import { localStoresEnabled } from "@/lib/redis";
import { defaultSite } from "@/lib/site/defaults";
import { SITE_TAG } from "@/lib/site/get-site";
import { orphanedResumeUrls } from "@/lib/site/history";
import { isResumePathname, looksLikePdf, ownBlobAccess, RESUME_MAX_BYTES } from "@/lib/site/resume";
import { contentSchema, issueText, type Resume, type SiteDoc } from "@/lib/site/schema";
import { getStore, StoreNotConfiguredError, type WriteResult } from "@/lib/site/store";

export type LoginState = { error?: string; ok?: boolean };

/**
 * Checks a password against a stored hash, after the rate limit. `bucket` keeps
 * sign-in and save-password tries counted separately per IP.
 */
async function checkPassword(password: unknown, hash: string | undefined, bucket: string): Promise<string | null> {
  const state = getAdminState();
  if (!state || !hash) return "Admin isn't set up yet. See the list on the sign-in page.";
  const ip = ipAddress(await headers()) ?? "unknown";
  let allowed: boolean;
  try {
    allowed = await state.allowLogin(`${bucket}:${ip}`);
  } catch (error) {
    console.error("[admin] rate limit check failed", error);
    return "Couldn't reach storage. Try again in a minute.";
  }
  if (!allowed) return "Too many tries. Wait 15 minutes, then try again.";
  if (typeof password !== "string" || !(await verifyPassword(password, hash))) return "That password isn't right.";
  return null;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const error = await checkPassword(formData.get("password"), process.env.ADMIN_PASSWORD_HASH, "login");
  if (error) return { error };
  await startSession();
  return { ok: true };
}

/**
 * Local development only (SITE_STORE=file and not a production build): sign in
 * and unlock saving in one click. Refused everywhere else, including Vercel.
 */
export async function devSignIn(): Promise<LoginState> {
  if (!localStoresEnabled()) return { error: "Not available here." };
  const id = await startSession();
  await getAdminState()!.unlockSaving(id);
  return { ok: true };
}

/** Local development only: unlock saving without the save password. */
export async function devUnlockSaving(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!localStoresEnabled()) return { ok: false, error: "Not available here." };
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotSignedInError) return { ok: false, error: error.message };
    throw error;
  }
  await unlockSavingForSession();
  return { ok: true };
}

/** Whether changes are unlocked right now (the save password was entered in the last 15 minutes). */
export async function savingStatus(): Promise<{ unlocked: boolean }> {
  return { unlocked: await isSavingUnlocked() };
}

/** The second password: unlocks saving, undo and resume changes for 15 minutes. */
export async function unlockSaving(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotSignedInError) return { ok: false, error: error.message };
    throw error;
  }
  const error = await checkPassword(password, process.env.ADMIN_SAVE_PASSWORD_HASH, "save");
  if (error) return { ok: false, error };
  await unlockSavingForSession();
  return { ok: true };
}

export async function logout(): Promise<void> {
  await endSession();
}

export type SaveResult =
  | { ok: true; doc: SiteDoc; canUndo: boolean }
  | { ok: false; error: string; issues?: string[]; locked?: boolean };

/** Runs a change, turning the usual failures into a message for the page. */
async function guarded(run: () => Promise<SaveResult>): Promise<SaveResult> {
  try {
    await requireSavingUnlocked();
    return await run();
  } catch (error) {
    if (error instanceof SavingLockedError) return { ok: false, error: error.message, locked: true };
    if (error instanceof NotSignedInError || error instanceof StoreNotConfiguredError) {
      return { ok: false, error: error.message };
    }
    console.error("[admin] action failed", error);
    return { ok: false, error: "Something went wrong while saving. Nothing was changed." };
  }
}

const CONFLICT = "This page is out of date: the site was changed in another tab. Reload to get the latest, then redo your edit.";

/** After a save: refresh the public page, and delete resume files nothing points to any more. */
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
        console.error("[admin] couldn't delete old resume files", error);
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

/** The first few bytes of a file on the site's Blob store. */
async function firstBytes(url: string, access: "private" | "public"): Promise<Uint8Array> {
  const file = await get(url, { access, useCache: false });
  if (!file || file.statusCode !== 200) return new Uint8Array();
  const reader = file.stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (length < 8) {
    const { value, done } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    length += value.length;
  }
  await reader.cancel().catch(() => undefined);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Called by the admin page after the browser uploaded a PDF straight to Vercel
 * Blob. Checks the file really is a PDF on this site's store before using it.
 */
export async function finishResumeUpload(expectedRev: number, url: string): Promise<SaveResult> {
  return guarded(async () => {
    const access = typeof url === "string" ? ownBlobAccess(url) : null;
    if (!access) return { ok: false, error: "That upload didn't come from this site's storage." };

    const reject = async (error: string): Promise<SaveResult> => {
      await del(url).catch(() => undefined);
      return { ok: false, error };
    };

    const info = await head(url);
    if (!isResumePathname(info.pathname)) return reject("That upload has an unexpected name.");
    if (info.contentType !== "application/pdf") return reject("Only PDF files can be used as the resume.");
    if (info.size > RESUME_MAX_BYTES) return reject("The PDF is over 5 MB. Export a smaller one and try again.");
    if (!looksLikePdf(await firstBytes(url, access))) return reject("That file isn't a real PDF.");

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
