"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isAdminShortcut } from "@/lib/site/shortcut";

/** Listens for Ctrl + H on the public pages and opens the admin sign-in. */
export function AdminShortcut() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isAdminShortcut(e)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      e.preventDefault();
      router.push("/admin");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
