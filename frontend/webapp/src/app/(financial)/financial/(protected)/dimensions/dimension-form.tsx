"use client";

import { useActionState, useState } from "react";

import {
  createDimensionAction,
  toggleDimensionAction,
  type ActionState,
} from "../dimension-actions";

/** Only cost centres and projects carry a budget; only projects carry dates. */
const KINDS = [
  { value: "cost_center", label: "مرکز هزینه", budget: true, dates: false },
  { value: "project", label: "پروژه", budget: true, dates: true },
  { value: "branch", label: "شعبه", budget: false, dates: false },
  { value: "department", label: "دپارتمان", budget: false, dates: false },
];

export function DimensionForm() {
  const [kind, setKind] = useState("cost_center");
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createDimensionAction,
    {}
  );

  const selected = KINDS.find((k) => k.value === kind)!;

  return (
    <form action={action} className="space-y-3">
      {state.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.ok}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">نوع</span>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full rounded-md border p-2"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">کد</span>
          <input
            name="code"
            required
            placeholder="OPS"
            dir="ltr"
            className="w-full rounded-md border p-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">عنوان فارسی</span>
          <input name="name-fa" required className="w-full rounded-md border p-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">عنوان انگلیسی</span>
          <input name="name-en" dir="ltr" className="w-full rounded-md border p-2" />
        </label>

        {selected.budget && (
          <>
            <label className="text-sm">
              <span className="mb-1 block font-medium">بودجه</span>
              <input
                name="budget"
                inputMode="decimal"
                dir="ltr"
                className="w-full rounded-md border p-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">ارز بودجه</span>
              <select name="budget-currency" className="w-full rounded-md border p-2">
                <option value="">—</option>
                <option value="IRR">IRR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </select>
            </label>
          </>
        )}

        {selected.dates && (
          <>
            <label className="text-sm">
              <span className="mb-1 block font-medium">شروع</span>
              <input name="starts-on" type="date" className="w-full rounded-md border p-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">پایان</span>
              <input name="ends-on" type="date" className="w-full rounded-md border p-2" />
            </label>
          </>
        )}

        <label className="text-sm md:col-span-4">
          <span className="mb-1 block font-medium">توضیح</span>
          <input name="description" className="w-full rounded-md border p-2" />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "در حال ثبت…" : "افزودن"}
      </button>
    </form>
  );
}

export function DimensionToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    toggleDimensionAction,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={String(!isActive)} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border px-2 py-1 text-xs disabled:opacity-40"
      >
        {isActive ? "غیرفعال کردن" : "فعال کردن"}
      </button>
      {state.error && <p className="mt-1 max-w-40 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
