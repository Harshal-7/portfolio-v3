import { Analytics } from "@vercel/analytics/next";

/**
 * Public pages. Vercel Web Analytics is cookieless and only loads here, so the
 * secret admin page and its previews are never counted (or their address sent).
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
