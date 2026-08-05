"use client";

import { useActionState, useMemo, useState } from "react";

import type { PostableAccount } from "@/accounting/server/manual-entry.queries";

import {
  applyTemplateAction,
  createScheduleAction,
  createTemplateAction,
  runSchedulesAction,
  toggleScheduleAction,
  toggleTemplateAction,
  type TemplateActionState,
} from "../template-actions";

type Row = { key: number; accountId: string; side: "debit" | "credit"; amount: string; memo: string };

const emptyRow = (key: number): Row => ({ key, accountId: "", side: "debit", amount: "", memo: "" });

export function TemplateForm({ accounts }: { accounts: PostableAccount[] }) {
  const [rows, setRows] = useState<Row[]>([emptyRow(1), emptyRow(2)]);
  const [nextKey, setNextKey] = useState(3);
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    createTemplateAction,
    {}
  );

  const update = (key: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  /*
   * Mirrors the rule the service enforces: a template where every line carries an
   * amount must balance. One with blanks is a shape to be filled in, so it is not
   * checked — showing an imbalance warning for it would be noise.
   */
  const balance = useMemo(() => {
    const priced = rows.filter((r) => r.amount.trim());
    if (priced.length === 0 || priced.length !== rows.filter((r) => r.accountId).length) {
      return null;
    }
    const debit = priced
      .filter((r) => r.side === "debit")
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const credit = priced
      .filter((r) => r.side === "credit")
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return debit - credit;
  }, [rows]);

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
          <span className="mb-1 block font-medium">کد</span>
          <input name="code" required dir="ltr" placeholder="RENT" className="w-full rounded-md border p-2" />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">عنوان</span>
          <input name="name-fa" required className="w-full rounded-md border p-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">نوع سند</span>
          <select name="entry-type" defaultValue="general" className="w-full rounded-md border p-2">
            <option value="general">عمومی</option>
            <option value="payment">پرداخت</option>
            <option value="receipt">دریافت</option>
            <option value="adjustment">اصلاحی</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs">
            <tr>
              <th className="p-2 text-start">حساب</th>
              <th className="p-2 text-start">طرف</th>
              <th className="p-2 text-start">مبلغ (اختیاری)</th>
              <th className="p-2 text-start">شرح</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t">
                <td className="p-1">
                  <select
                    name="tl-account"
                    value={row.accountId}
                    onChange={(e) => update(row.key, { accountId: e.target.value })}
                    className="w-full min-w-52 rounded border p-1.5"
                  >
                    <option value="">— انتخاب حساب —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <select
                    name="tl-side"
                    value={row.side}
                    onChange={(e) => update(row.key, { side: e.target.value as "debit" | "credit" })}
                    className="w-full rounded border p-1.5"
                  >
                    <option value="debit">بدهکار</option>
                    <option value="credit">بستانکار</option>
                  </select>
                </td>
                <td className="p-1">
                  <input
                    name="tl-amount"
                    inputMode="decimal"
                    dir="ltr"
                    value={row.amount}
                    onChange={(e) => update(row.key, { amount: e.target.value })}
                    className="w-full min-w-28 rounded border p-1.5 text-end"
                  />
                </td>
                <td className="p-1">
                  <input
                    name="tl-memo"
                    value={row.memo}
                    onChange={(e) => update(row.key, { memo: e.target.value })}
                    className="w-full min-w-32 rounded border p-1.5"
                  />
                </td>
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => setRows((p) => (p.length <= 2 ? p : p.filter((r) => r.key !== row.key)))}
                    disabled={rows.length <= 2}
                    className="text-muted-foreground hover:text-red-600 disabled:opacity-30"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRows((p) => [...p, emptyRow(nextKey)]);
            setNextKey((k) => k + 1);
          }}
          className="hover:bg-muted rounded-md border px-3 py-2 text-sm"
        >
          + ردیف
        </button>

        {balance !== null && balance !== 0 && (
          <span className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            الگوی کاملاً قیمت‌گذاری‌شده باید تراز باشد — اختلاف{" "}
            <span dir="ltr">{Math.abs(balance).toLocaleString("fa-IR")}</span>
          </span>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "…" : "ساخت الگو"}
        </button>
      </div>
    </form>
  );
}

export function ToggleButton({
  kind,
  id,
  isActive,
}: {
  kind: "template" | "schedule";
  id: string;
  isActive: boolean;
}) {
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    kind === "template" ? toggleTemplateAction : toggleScheduleAction,
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
        {isActive ? "غیرفعال" : "فعال"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function ApplyTemplateButton({ id, today }: { id: string; today: string }) {
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    applyTemplateAction,
    {}
  );

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input
        name="entry-date"
        type="date"
        defaultValue={today}
        className="rounded border p-1 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 disabled:opacity-40"
      >
        {pending ? "…" : "ساخت سند"}
      </button>
      {state.ok && <span className="text-xs text-emerald-700">{state.ok}</span>}
      {state.error && <span className="max-w-40 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export function ScheduleForm({
  templates,
  today,
}: {
  templates: { id: string; code: string; name: string }[];
  today: string;
}) {
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    createScheduleAction,
    {}
  );

  return (
    <form action={action} className="space-y-3">
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}

      <div className="grid gap-3 md:grid-cols-6">
        <label className="text-sm">
          <span className="mb-1 block font-medium">کد</span>
          <input name="code" required dir="ltr" className="w-full rounded-md border p-2" />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">الگو</span>
          <select name="template-id" required className="w-full rounded-md border p-2">
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">تناوب</span>
          <select name="frequency" defaultValue="monthly" className="w-full rounded-md border p-2">
            <option value="daily">روزانه</option>
            <option value="weekly">هفتگی</option>
            <option value="monthly">ماهانه</option>
            <option value="quarterly">فصلی</option>
            <option value="yearly">سالانه</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">شروع</span>
          <input
            name="starts-on"
            type="date"
            required
            defaultValue={today}
            className="w-full rounded-md border p-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">پایان</span>
          <input name="ends-on" type="date" className="w-full rounded-md border p-2" />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "…" : "افزودن زمان‌بندی"}
      </button>
    </form>
  );
}

export function RunSchedulesButton({ dueCount }: { dueCount: number }) {
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    runSchedulesAction,
    {}
  );

  return (
    <form action={action} className="space-y-2">
      <button
        type="submit"
        disabled={pending || dueCount === 0}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-40"
      >
        {pending
          ? "در حال ساخت اسناد…"
          : dueCount === 0
            ? "زمان‌بندی سررسیدی نیست"
            : `ساخت اسناد ${dueCount} زمان‌بندی سررسیدشده`}
      </button>
      {state.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
