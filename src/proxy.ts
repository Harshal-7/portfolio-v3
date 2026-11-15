import { NextResponse, type NextRequest } from "next/server";

import { NOT_FOUND_PATH, routeAdmin } from "@/lib/admin/route";

/**
 * Serves the admin page only at its secret address, and makes /admin a 404.
 * This is a rewrite at request time rather than a next.config rewrite, so the
 * secret never appears in the public build manifest.
 */
export function proxy(request: NextRequest) {
  const route = routeAdmin(request.nextUrl.pathname, process.env.ADMIN_PATH);
  if (route.type === "pass") return NextResponse.next();

  const url = request.nextUrl.clone();
  if (route.type === "not-found") {
    url.pathname = NOT_FOUND_PATH;
    return NextResponse.rewrite(url);
  }

  url.pathname = route.pathname;
  const response = NextResponse.rewrite(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  // Everything except the home page, build assets and static files. The home page
  // is never touched, so it stays a plain cached page.
  matcher: [
    "/((?!_next/static|_next/image|index\\.(?:rsc|segments)|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff|woff2)$).+)",
  ],
};
