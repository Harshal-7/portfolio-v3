import { get } from "@vercel/blob";
import { connection } from "next/server";

import { defaultSite } from "@/lib/site/defaults";
import { ownBlobAccess, resumeFileName } from "@/lib/site/resume";
import type { SiteDoc } from "@/lib/site/schema";
import { getStore } from "@/lib/site/store";

/**
 * /resume always shows the newest uploaded PDF. The Blob store is private, so
 * this route reads the file and sends it under the site's own address. It reads
 * the store directly (not the cached copy), so a new upload is live at once.
 */
export async function GET() {
  await connection();
  let doc: SiteDoc | null = null;
  try {
    doc = await getStore().read();
  } catch (error) {
    console.error("[resume] couldn't read the site document", error);
  }

  // Before the first admin save the store is empty, so use the default resume.
  const url = (doc ?? defaultSite).resume?.url;
  const access = url ? ownBlobAccess(url) : null;

  if (url && access === "public") {
    return new Response(null, { status: 307, headers: { Location: url, "Cache-Control": "no-store" } });
  }

  if (url && access === "private") {
    try {
      const file = await get(url, { access: "private" });
      if (file?.statusCode === 200) {
        return new Response(file.stream, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Length": String(file.blob.size),
            "Content-Disposition": `inline; filename="${resumeFileName((doc ?? defaultSite).profile.name)}"`,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    } catch (error) {
      console.error("[resume] couldn't read the PDF from Blob", error);
    }
  }

  const email = (doc ?? defaultSite).profile.email;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Resume coming soon</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;font:16px/1.6 ui-sans-serif,system-ui,sans-serif;background:#fbfbfa;color:#18181b}main{max-width:32rem;padding:24px}a{color:#4338ca}@media (prefers-color-scheme:dark){body{background:#141416;color:#ececee}a{color:#b9c3ff}}</style></head><body><main><h1 style="font-size:22px;margin:0 0 8px">The new resume is on its way.</h1><p style="margin:0">Email <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> and I’ll send it over, or <a href="/">go back to the home page</a>.</p></main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
