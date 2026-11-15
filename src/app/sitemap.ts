import type { MetadataRoute } from "next";

import { getSite } from "@/lib/site/get-site";
import { siteUrl } from "@/lib/site/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  return [{ url: siteUrl().toString(), lastModified: site.updatedAt }];
}
