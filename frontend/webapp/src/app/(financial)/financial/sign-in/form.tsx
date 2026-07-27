"use client";

import { useActionState } from "react";

import { signInAction, type SignInState } from "../auth-actions";

export function SignInForm({ labels }: { labels: Record<string, string> }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});

  return (
    <form action={action} className="space-y-3">
      <label className="block text-xs">
        <span className="text-muted-foreground">{labels.username}</span>
        <input
          name="username"
          autoComplete="username"
          required
          dir="ltr"
          className="mt-1 h-10 w-full rounded border px-3"
        />
      </label>

      <label className="block text-xs">
        <span className="text-muted-foreground">{labels.password}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className="mt-1 h-10 w-full rounded border px-3"
        />
      </label>

      {state.error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {labels[state.error] ?? labels.invalid}
        </p>
      )}

      <button
        disabled={pending}
        className="bg-primary text-primary-foreground h-10 w-full rounded text-sm font-semibold disabled:opacity-60"
      >
        {labels.submit}
      </button>
    </form>
  );
}
