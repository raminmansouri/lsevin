"use client";

import { useActionState, useMemo, useState } from "react";

import type { DimensionOption, PostableAccount } from "@/accounting/server/manual-entry.queries";

import { createEntryAction, type EntryFormState } from "../entry-actions";

type Row = {
  key: number;
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
  costCenterId: string;
  projectId: string;
};

const emptyRow = (key: number): Row => ({
  key,
  accountId: "",
  debit: "",
  credit: "",
  memo: "",
  costCenterId: "",
  projectId: "",
});

/**
 * Formats a decimal for display without ever rounding the underlying value.
 *
 * The amounts are numeric(38,18) in the database and travel as strings for that
 * reason. Only the running total shown on screen goes through Number(), and it is
 * never sent back — the form posts the strings the user typed.
 */
function formatSum(value: number): string {
  return value.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

type Props = {
  accounts: PostableAccount[];
  dimensions: DimensionOption[];
  today: string;
  canPostToday: boolean;
};

export function EntryForm({ accounts, dimensions, today, canPostToday }: Props) {
  const [rows, setRows] = useState<Row[]>([emptyRow(1), emptyRow(2)]);
  const [nextKey, setNextKey] = useState(3);
  const [state, formAction, pending] = useActionState<EntryFormState, FormData>(
    createEntryAction,
    {}
  );

  const costCenters = useMemo(
    () => dimensions.filter((d) => d.kind === "cost_center"),
    [dimensions]
  );
  const projects = useMemo(() => dimensions.filter((d) => d.kind === "project"), [dimensions]);

  const totals = useMemo(() => {
    const debit = rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const credit = rows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    return { debit, credit, difference: debit - credit };
  }, [rows]);

  const balanced = totals.difference === 0 && totals.debit > 0;

  const update = (key: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  };

  const removeRow = (key: number) =>
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((r) => r.key !== key)));

  return (
    <form action={formAction} className="space-y-4">
      {!canPostToday && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          هیچ دورهٔ مالی بازی امروز را پوشش نمی‌دهد. تا زمانی که دوره ساخته نشود، سند ثبت نمی‌شود.
        </p>
      )}

      {state.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.ok} {state.entryNumber && <span dir="ltr">#{state.entryNumber}</span>}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">تاریخ سند</span>
          <input
            name="entry-date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-md border p-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">شمارهٔ عطف</span>
          <input
            name="reference-number"
            placeholder="شمارهٔ فاکتور یا رسید بانکی"
            className="w-full rounded-md border p-2"
            dir="ltr"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">نوع سند</span>
          <select name="entry-type" defaultValue="general" className="w-full rounded-md border p-2">
            <option value="general">عمومی</option>
            <option value="receipt">دریافت</option>
            <option value="payment">پرداخت</option>
            <option value="provider_settlement">تسویه با ارائه‌دهنده</option>
            <option value="patient_refund">بازپرداخت بیمار</option>
            <option value="fx_revaluation">تسعیر ارز</option>
            <option value="adjustment">اصلاحی</option>
          </select>
        </label>

        <label className="text-sm md:col-span-4">
          <span className="mb-1 block font-medium">شرح کلی سند</span>
          <input
            name="description"
            required
            placeholder="مثلاً دریافت وجه از بیمار بابت رزرو شمارهٔ…"
            className="w-full rounded-md border p-2"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs">
            <tr>
              <th className="p-2 text-start">حساب</th>
              <th className="p-2 text-start">شرح ردیف</th>
              <th className="p-2 text-start">مرکز هزینه</th>
              <th className="p-2 text-start">پروژه</th>
              <th className="p-2 text-start">بدهکار</th>
              <th className="p-2 text-start">بستانکار</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const account = accounts.find((a) => a.id === row.accountId);
              return (
                <tr key={row.key} className="border-t">
                  <td className="p-1">
                    <select
                      name="line-account"
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
                    <input
                      name="line-memo"
                      value={row.memo}
                      onChange={(e) => update(row.key, { memo: e.target.value })}
                      className="w-full min-w-32 rounded border p-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <select
                      name="line-cost-center"
                      value={row.costCenterId}
                      onChange={(e) => update(row.key, { costCenterId: e.target.value })}
                      className={`w-full min-w-32 rounded border p-1.5 ${
                        account?.requiresCostCenter && !row.costCenterId ? "border-amber-500" : ""
                      }`}
                    >
                      <option value="">—</option>
                      {costCenters.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <select
                      name="line-project"
                      value={row.projectId}
                      onChange={(e) => update(row.key, { projectId: e.target.value })}
                      className={`w-full min-w-32 rounded border p-1.5 ${
                        account?.requiresProject && !row.projectId ? "border-amber-500" : ""
                      }`}
                    >
                      <option value="">—</option>
                      {projects.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      name="line-debit"
                      inputMode="decimal"
                      value={row.debit}
                      // A line carries one side. Typing into debit clears credit so the
                      // grid cannot produce a row the service will reject.
                      onChange={(e) => update(row.key, { debit: e.target.value, credit: "" })}
                      className="w-full min-w-28 rounded border p-1.5 text-end"
                      dir="ltr"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      name="line-credit"
                      inputMode="decimal"
                      value={row.credit}
                      onChange={(e) => update(row.key, { credit: e.target.value, debit: "" })}
                      className="w-full min-w-28 rounded border p-1.5 text-end"
                      dir="ltr"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length <= 2}
                      className="text-muted-foreground hover:text-red-600 disabled:opacity-30"
                      aria-label="حذف ردیف"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          + افزودن ردیف
        </button>

        <div
          className={`flex flex-wrap gap-4 rounded-md border p-3 text-sm ${
            balanced
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <span>
            جمع بدهکار: <strong dir="ltr">{formatSum(totals.debit)}</strong>
          </span>
          <span>
            جمع بستانکار: <strong dir="ltr">{formatSum(totals.credit)}</strong>
          </span>
          <span>
            اختلاف: <strong dir="ltr">{formatSum(Math.abs(totals.difference))}</strong>
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {/*
          Saving is allowed while unbalanced on purpose: a draft is a work in
          progress. The database refuses to let it reach the books that way, so
          blocking the save here would only cost the accountant their typing.
        */}
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "در حال ذخیره…" : "ذخیرهٔ پیش‌نویس"}
        </button>
      </div>
    </form>
  );
}
