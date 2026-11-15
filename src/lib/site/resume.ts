/**
 * Résumé storage on Vercel Blob. The store is private: files are only reachable
 * with the site's credentials, so /resume reads the PDF and sends it itself.
 *
 * Connecting a private store to the project sets BLOB_STORE_ID and
 * BLOB_WEBHOOK_PUBLIC_KEY; on Vercel the SDK signs in with the deployment's
 * OIDC token, so there is no read-write token to manage.
 */

export const BLOB_ACCESS = "private" as const;
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

type Env = Record<string, string | undefined>;

/** The store id ("store_AbC12" → "abc12"), as it appears in the store's host name. */
export function blobStoreId(env: Env = process.env): string | null {
  const fromId = env.BLOB_STORE_ID?.trim().replace(/^store_/, "");
  if (fromId && /^[A-Za-z0-9]+$/.test(fromId)) return fromId.toLowerCase();
  // Older setups use a read-write token: vercel_blob_rw_<storeId>_<secret>.
  const match = env.BLOB_READ_WRITE_TOKEN ? /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(env.BLOB_READ_WRITE_TOKEN) : null;
  return match ? match[1].toLowerCase() : null;
}

/** True when a private Blob store is connected the way the upload route expects. */
export function blobConfigured(env: Env = process.env): boolean {
  return !!blobStoreId(env) && !!env.BLOB_WEBHOOK_PUBLIC_KEY;
}

/**
 * "private" or "public" when the URL is an https file on this site's own store,
 * otherwise null. Checked before /resume serves or redirects to anything, so a
 * bad saved value can't become an open redirect or a proxy to another site.
 */
export function ownBlobAccess(value: string, env: Env = process.env): "private" | "public" | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const match = /^([a-z0-9]+)\.(private|public)\.blob\.vercel-storage\.com$/.exec(url.hostname);
  const id = blobStoreId(env);
  if (!match || !id || match[1] !== id) return null;
  return match[2] as "private" | "public";
}

/** Upload names the admin page may use: resume/<name>-<random>.pdf */
export function isResumePathname(pathname: string): boolean {
  return /^resume\/[A-Za-z0-9._-]{1,90}\.pdf$/.test(pathname);
}

/** Every PDF starts with these bytes. */
export function looksLikePdf(head: Uint8Array): boolean {
  return head.length >= 5 && String.fromCharCode(...head.slice(0, 5)) === "%PDF-";
}

/** "Harshal Shinde" → "Harshal-Shinde-Resume.pdf" */
export function resumeFileName(name: string): string {
  const base = name.normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "Resume"}-Resume.pdf`.replace(/^Resume-Resume/, "Resume");
}
