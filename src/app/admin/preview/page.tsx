import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { isAdmin } from "@/lib/admin/session";
import { defaultSite } from "@/lib/site/defaults";
import { getStore } from "@/lib/site/store";

import { DraftPreview } from "./draft-preview";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** The site as it would look with the admin's unsaved edits. Admin only. */
export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  if (!(await isAdmin())) notFound();
  const saved = (await getStore().read()) ?? defaultSite;
  return <DraftPreview saved={saved} />;
}
