import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { validAdminPath } from "@/lib/admin/route";
import { adminSetupProblems, isAdmin } from "@/lib/admin/session";
import { localStoresEnabled, redisConfig } from "@/lib/redis";
import { defaultSite } from "@/lib/site/defaults";
import { getStore } from "@/lib/site/store";

import { AdminPanel } from "./admin-panel";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Reached only through the secret ADMIN_PATH (see src/proxy.ts). */
export default function AdminPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-32 pt-8 font-sans text-[15px] text-fg sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const secret = validAdminPath(process.env.ADMIN_PATH);
  if (!secret) notFound();

  if (!(await isAdmin())) return <LoginForm problems={adminSetupProblems()} />;

  const stored = await getStore()
    .readAll()
    .catch((error: unknown) => {
      console.error("[admin] couldn't read the site document", error);
      return null;
    });
  if (!stored) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h1 className="text-lg font-semibold">The saved content couldn’t be read</h1>
        <p className="mt-2 text-muted">
          Storage didn’t answer, or the saved document no longer matches the expected shape. The public site is showing
          the default content meanwhile. Try reloading in a minute; if it keeps happening, check the Vercel logs.
        </p>
      </div>
    );
  }

  return (
    <AdminPanel
      initial={stored.doc ?? defaultSite}
      initialCanUndo={stored.history.length > 0}
      base={`/${secret}`}
      storeReady={!!redisConfig() || localStoresEnabled()}
      blobReady={!!process.env.BLOB_READ_WRITE_TOKEN}
    />
  );
}
