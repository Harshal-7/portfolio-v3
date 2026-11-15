/**
 * Routing for the secret admin page. Pure, so the proxy stays small and testable.
 *
 * - /<ADMIN_PATH> and anything under it is rewritten to the internal /admin route.
 * - /admin itself (any case, encoded or not) gets a 404, so the page can only be
 *   reached through the secret address.
 */

export const ADMIN_PATH_RE = /^[A-Za-z0-9_-]{24,}$/;
export const INTERNAL_ADMIN = "/admin";
/** A path with no route behind it, so rewriting to it renders the 404 page. */
export const NOT_FOUND_PATH = "/_not-found-admin";

export function validAdminPath(value: string | undefined): string | null {
  return value && ADMIN_PATH_RE.test(value) ? value : null;
}

export type AdminRoute =
  | { type: "pass" }
  | { type: "not-found" }
  | { type: "admin"; pathname: string };

function decode(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

export function routeAdmin(pathname: string, adminPath: string | undefined): AdminRoute {
  const decoded = decode(pathname);
  // "/admin", "/admin/…" and "/admin.rsc"-style variants, in any letter case.
  if (/^\/+admin(?:$|[/.;])/i.test(decoded)) return { type: "not-found" };

  const secret = validAdminPath(adminPath);
  if (!secret) return { type: "pass" };
  const base = `/${secret}`;
  if (pathname === base) return { type: "admin", pathname: INTERNAL_ADMIN };
  if (pathname.startsWith(`${base}/`)) {
    return { type: "admin", pathname: INTERNAL_ADMIN + pathname.slice(base.length) };
  }
  return { type: "pass" };
}
