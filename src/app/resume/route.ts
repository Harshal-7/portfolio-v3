import { connection } from "next/server";

import { defaultSite } from "@/lib/site/defaults";
import { isOwnBlobUrl } from "@/lib/site/resume";
import { getStore } from "@/lib/site/store";

/**
 * /resume always points at the newest uploaded PDF. It reads the store directly
 * (not the cached copy), so a new upload is live at once.
 */
export async function GET() {
  await connection();
  let doc = null;
  try {
    doc = await getStore().read();
  } catch (error) {
    console.error("[resume] couldn't read the site document", error);
  }

  const url = doc?.resume?.url;
  if (url && isOwnBlobUrl(url)) {
    return new Response(null, {
      status: 307,
      headers: { Location: url, "Cache-Control": "no-store" },
    });
  }

  const email = (doc ?? defaultSite).profile.email;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Résumé coming soon</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;font:16px/1.6 ui-sans-serif,system-ui,sans-serif;background:#fbfbfa;color:#18181b}main{max-width:32rem;padding:24px}a{color:#4338ca}@media (prefers-color-scheme:dark){body{background:#141416;color:#ececee}a{color:#b9c3ff}}</style></head><body><main><h1 style="font-size:22px;margin:0 0 8px">The new résumé is on its way.</h1><p style="margin:0">Email <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> and I’ll send it over, or <a href="/">go back to the home page</a>.</p></main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
