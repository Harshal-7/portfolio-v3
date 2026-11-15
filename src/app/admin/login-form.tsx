"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { login, type LoginState } from "./actions";
import { PixelPassword, type PasswordStatus } from "./pixel-password";

export function LoginForm({ problems }: { problems: string[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [value, setValue] = useState("");
  const [failed, setFailed] = useState(false);
  const [shake, setShake] = useState(0);

  // React to each new answer from the server while rendering (no extra effect pass).
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.error) {
      setValue("");
      setFailed(true);
      setShake((n) => n + 1);
    }
  }

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const status: PasswordStatus = pending ? "checking" : state.ok ? "ok" : failed ? "error" : "idle";
  const statusText =
    status === "checking"
      ? "Verifying…"
      : status === "ok"
        ? "Access granted"
        : status === "error"
          ? (state.error ?? "Try again")
          : value
            ? `${value.length} character${value.length === 1 ? "" : "s"}`
            : "Locked";

  return (
    <div className="ad-backdrop grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <span className="pp-light" data-status={status} aria-hidden="true" />
          /admin · {status === "ok" ? "open" : "locked"}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Site admin</h1>
        <p className="mt-1 text-muted">Enter the password to continue.</p>

        {problems.length > 0 && (
          <div className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="font-medium">
              Setup isn’t finished. Add these in Vercel → Settings → Environment Variables, then redeploy:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <form action={action} className="mt-7 flex flex-col gap-3">
          <PixelPassword
            label="Password"
            name="password"
            value={value}
            onChange={(v) => {
              setValue(v);
              setFailed(false);
            }}
            status={status}
            autoFocus
            shakeKey={shake}
          />
          <p
            role={status === "error" ? "alert" : undefined}
            aria-live="polite"
            className={`font-mono text-xs ${status === "error" ? "text-danger" : "text-muted"}`}
          >
            {statusText}
          </p>
          <button
            type="submit"
            disabled={pending || value.length === 0}
            className="mt-2 flex h-12 items-center justify-between rounded-xl bg-btn px-5 font-mono text-sm uppercase tracking-[0.14em] text-btn-fg transition-opacity disabled:opacity-40"
          >
            <span>{pending ? "Verifying" : "Unlock"}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
