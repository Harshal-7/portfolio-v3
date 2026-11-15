import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { defaultSite } from "./defaults";
import type { SiteDoc } from "./schema";
import { getStore } from "./store";

export const SITE_TAG = "site";

/**
 * The site content for public pages. Cached until an admin save calls
 * updateTag(SITE_TAG). If the store can't be read, the defaults are cached for
 * minutes only, so one outage doesn't pin them for a month.
 *
 * The admin page, Server Actions and /resume read the store directly instead.
 */
export async function getSite(): Promise<SiteDoc> {
  "use cache";
  cacheTag(SITE_TAG);
  try {
    const doc = await getStore().read();
    cacheLife("max");
    return doc ?? defaultSite;
  } catch (error) {
    console.error("[site] couldn't read the site document, showing defaults", error);
    cacheLife("minutes");
    return defaultSite;
  }
}
