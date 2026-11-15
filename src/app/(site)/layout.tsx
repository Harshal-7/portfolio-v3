import { Analytics } from "@vercel/analytics/next";

import { AdminShortcut } from "@/designs/shared/admin-shortcut";

/**
 * Public pages. Vercel Web Analytics is cookieless and only loads here, so admin
 * visits are never counted. Pressing H twice quickly opens the admin sign-in.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <AdminShortcut />
      <Analytics />
    </>
  );
}
