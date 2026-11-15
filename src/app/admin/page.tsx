import type { Metadata } from "next";
import { Suspense } from "react";

import { adminSetupProblems, isAdmin } from "@/lib/admin/session";
import { localStoresEnabled, redisConfig } from "@/lib/redis";
import { defaultSite } from "@/lib/site/defaults";
import { blobConfigured } from "@/lib/site/resume";
import { getStore } from "@/lib/site/store";

import { AdminPanel } from "./admin-panel";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Anyone can open /admin; everything on it needs the sign-in password, and every change the save password. */
export default function AdminPage() {
  return (
    <main className="min-h-dvh font-sans text-[15px] text-fg">
      <Suspense fallback={<p className="p-8 font-mono text-xs uppercase tracking-[0.16em] text-muted">Loading…</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  if (!(await isAdmin())) return <LoginForm problems={adminSetupProblems()} localQuick={localStoresEnabled()} />;

  const stored = await getStore()
    .readAll()
    .catch((error: unknown) => {
      console.error("[admin] couldn't read the site document", error);
      return null;
    });
  if (!stored) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-line bg-surface p-5">
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
      storeReady={!!redisConfig() || localStoresEnabled()}
      localQuick={localStoresEnabled()}
      blobReady={blobConfigured()}
    />
  );
}
