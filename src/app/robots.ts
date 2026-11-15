import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site/url";

// The admin page isn't listed here on purpose: naming it would publish the secret.
// It sends X-Robots-Tag: noindex instead.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
