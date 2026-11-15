/** Vercel Blob's public host for a store, read from its read-write token. */
export function blobHostFromToken(token: string | undefined): string | null {
  // Tokens look like vercel_blob_rw_<storeId>_<secret>.
  const match = token ? /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(token) : null;
  return match ? `${match[1].toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/**
 * True only for an https file on this site's Blob store. Used before redirecting
 * /resume anywhere, so a bad value can never turn it into an open redirect.
 */
export function isOwnBlobUrl(value: string, token = process.env.BLOB_READ_WRITE_TOKEN): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = blobHostFromToken(token);
  if (host) return url.hostname === host;
  return url.hostname.endsWith(".public.blob.vercel-storage.com");
}

/** Every PDF starts with these bytes. */
export function looksLikePdf(head: Uint8Array): boolean {
  return head.length >= 5 && String.fromCharCode(...head.slice(0, 5)) === "%PDF-";
}

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
