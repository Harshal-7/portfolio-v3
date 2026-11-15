"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createAdminShortcut } from "@/lib/site/shortcut";

/** Press H twice quickly on the public pages to open the admin sign-in. */
export function AdminShortcut() {
  const router = useRouter();
  useEffect(() => {
    const isShortcut = createAdminShortcut();
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (isShortcut(e, e.timeStamp)) router.push("/admin");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
