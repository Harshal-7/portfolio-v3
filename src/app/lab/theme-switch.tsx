"use client";

import { setMode, useMode } from "@/designs/shared/mode";

export function ThemeSwitch() {
  const mode = useMode();
  return (
    <div className="flex gap-2">
      {(["light", "dark"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`h-9 rounded-lg border px-3 font-mono text-xs uppercase tracking-[0.12em] ${
            mode === m ? "border-accent bg-accent-soft text-fg" : "border-line text-muted"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
