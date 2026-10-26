"use client";

import { useActionState } from "react";

import { PANEL_ROLE_LABEL, type PanelRole } from "@/accounting/server/permissions";

import {
  createPanelUserAction,
  resetPanelUserPasswordAction,
  setPanelUserActiveAction,
  type UserFormState,
} from "../users-actions";

/** The one-time password, shown once. It is not stored anywhere it could be read again. */
function Credentials({ state }: { state: UserFormState }) {
  if (!state.credentials) return null;
  return (
    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
      <p className="font-semibold">این رمز فقط همین یک بار نمایش داده می‌شود. آن را به کاربر بدهید؛ هنگام اولین ورود باید تغییرش دهد.</p>
      <div className="mt-1" dir="ltr">
        <span className="font-mono">{state.credentials.username}</span> / <span className="font-mono font-semibold">{state.credentials.password}</span>
      </div>
    </div>
  );
}

function Feedback({ state }: { state: UserFormState }) {
  if (state.error) return <p className="mt-1 text-xs font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p className="mt-1 text-xs font-medium text-green-700">{state.ok}</p>;
  return null;
}

export function NewUserForm({ roles }: { roles: PanelRole[] }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createPanelUserAction, {});
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs">
          <span className="text-muted-foreground">نام و نام خانوادگی</span>
          <input name="displayName" required className="mt-1 h-9 w-full rounded border px-2" />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">نام کاربری (انگلیسی)</span>
          <input name="username" dir="ltr" required className="mt-1 h-9 w-full rounded border px-2" />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">نقش</span>
          <select name="role" defaultValue={roles[roles.length - 1]} className="mt-1 h-9 w-full rounded border px-2">
            {roles.map((r) => (
              <option key={r} value={r}>
                {PANEL_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button disabled={pending} className="rounded bg-green-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
        {pending ? "در حال ثبت..." : "افزودن کاربر"}
      </button>
      <Feedback state={state} />
      <Credentials state={state} />
    </form>
  );
}

export function UserRowActions({ userId, isActive, name }: { userId: string; isActive: boolean; name: string }) {
  const [activeState, setActive, settingActive] = useActionState<UserFormState, FormData>(setPanelUserActiveAction, {});
  const [resetState, reset, resetting] = useActionState<UserFormState, FormData>(resetPanelUserPasswordAction, {});
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <form
          action={setActive}
          onSubmit={(event) => {
            if (isActive && !window.confirm(`دسترسی «${name}» به پنل مالی گرفته شود؟`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value={isActive ? "false" : "true"} />
          <button
            disabled={settingActive}
            className={`rounded border px-2 py-1 text-xs disabled:opacity-40 ${
              isActive ? "border-red-200 text-red-700" : "border-emerald-300 text-emerald-700"
            }`}
          >
            {isActive ? "حذف دسترسی" : "فعال‌سازی دوباره"}
          </button>
        </form>
        {isActive && (
          <form
            action={reset}
            onSubmit={(event) => {
              if (!window.confirm(`رمز «${name}» عوض شود؟ از پنل خارج می‌شود.`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="userId" value={userId} />
            <button disabled={resetting} className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-40">
              رمز جدید
            </button>
          </form>
        )}
      </div>
      <Feedback state={activeState.error ? activeState : resetState.error ? resetState : activeState.ok ? activeState : resetState} />
      <Credentials state={resetState} />
    </div>
  );
}
