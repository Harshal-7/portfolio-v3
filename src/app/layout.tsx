import type { Metadata, Viewport } from "next";

import { fontVariables } from "@/designs/shared/fonts";
import { THEME_SCRIPT } from "@/designs/shared/theme";
import { getSite } from "@/lib/site/get-site";
import { siteUrl } from "@/lib/site/url";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const { name, role, headline } = site.profile;
  return {
    metadataBase: siteUrl(),
    title: { default: role ? `${name} · ${role}` : name, template: `%s · ${name}` },
    description: headline,
    openGraph: { title: name, description: headline, type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#141416" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await getSite();
  return (
    <html lang="en" data-default-mode={site.defaultMode} suppressHydrationWarning className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
