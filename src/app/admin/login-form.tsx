"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { login, type LoginState } from "./actions";

export function LoginForm({ problems }: { problems: string[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <div className="mx-auto mt-[12vh] max-w-sm">
      <h1 className="text-xl font-semibold tracking-tight">Site admin</h1>
      <p className="mt-1 text-muted">Sign in to change the design and the text on the site.</p>

      {problems.length > 0 && (
        <div className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm">
          <p className="font-medium">Setup isn’t finished:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <form action={action} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
            className="h-11 rounded-xl border border-line bg-surface px-3 outline-none focus:border-accent"
          />
        </label>
        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-btn px-4 font-medium text-btn-fg disabled:opacity-60"
        >
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
