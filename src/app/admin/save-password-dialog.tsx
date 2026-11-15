"use client";

import { useState } from "react";

import { devUnlockSaving, unlockSaving } from "./actions";
import { ghostButton } from "./admin-ui";
import { PixelPassword, type PasswordStatus } from "./pixel-password";

/** The second password, asked before the first change and again every 15 minutes. */
export function SavePasswordDialog({
  open,
  onDone,
  localQuick,
}: {
  open: boolean;
  onDone: (unlocked: boolean) => void;
  localQuick?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [shake, setShake] = useState(0);
  if (!open) return null;

  const close = (ok: boolean) => {
    setPassword("");
    setError(null);
    setUnlocked(false);
    onDone(ok);
  };
  const status: PasswordStatus = busy ? "checking" : unlocked ? "ok" : error ? "error" : "idle";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-password-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) close(false);
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!password) return;
          setBusy(true);
          setError(null);
          const result = await unlockSaving(password);
          setBusy(false);
          if (result.ok) {
            setUnlocked(true);
            setTimeout(() => close(true), 350);
          } else {
            setError(result.error);
            setPassword("");
            setShake((n) => n + 1);
          }
        }}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-2xl"
      >
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <span className="pp-light" data-status={status} aria-hidden="true" />
          Saving · {unlocked ? "unlocked" : "locked"}
        </p>
        <h2 id="save-password-title" className="text-lg font-semibold tracking-tight">
          Save password
        </h2>
        <p className="text-sm text-muted">Needed for changes. Stays unlocked for 15 minutes.</p>
        <PixelPassword
          label="Save password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setError(null);
          }}
          status={status}
          autoFocus
          autoComplete="off"
          shakeKey={shake}
        />
        {error && (
          <p role="alert" className="font-mono text-xs text-danger">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          {localQuick && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const result = await devUnlockSaving();
                if (result.ok) close(true);
                else setError(result.error);
              }}
              className="mr-auto h-10 rounded-xl border border-dashed border-line px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:border-accent hover:text-fg"
            >
              Local unlock
            </button>
          )}
          <button type="button" onClick={() => close(false)} disabled={busy} className={ghostButton}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="h-10 rounded-xl bg-btn px-4 font-mono text-xs uppercase tracking-[0.14em] text-btn-fg disabled:opacity-40"
          >
            {busy ? "Verifying" : "Unlock →"}
          </button>
        </div>
      </form>
    </div>
  );
}
