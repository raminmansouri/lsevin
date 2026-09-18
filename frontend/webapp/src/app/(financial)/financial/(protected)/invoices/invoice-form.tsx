"use client";

import { useActionState, useMemo, useState } from "react";

import type { DimensionOption, PostableAccount } from "@/accounting/server/manual-entry.queries";

import { createInvoiceAction, type InvoiceFormState } from "../invoice-actions";

type Row = {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
  accountId: string;
  costCenterId: string;
  projectId: string;
};

const emptyRow = (key: number): Row => ({
  key,
  description: "",
  quantity: "1",
  unitPrice: "",
  accountId: "",
  costCenterId: "",
  projectId: "",
});

/**
 * Formats a decimal for display without ever rounding the underlying value.
 *
 * Only the running total shown on screen goes through Number(), and it is never sent
 * back — the form posts the strings the user typed, and the server multiplies them
 * with integer arithmetic.
 */
function formatSum(value: number): string {
  return value.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

type Props = {
  accounts: PostableAccount[];
  dimensions: DimensionOption[];
  today: string;
  baseCurrency: string;
};

export function InvoiceForm({ accounts, dimensions, today, baseCurrency }: Props) {
  const [kind, setKind] = useState<"sale" | "purchase">("sale");
  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);
  const [nextKey, setNextKey] = useState(2);
  const [tax, setTax] = useState("");
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(
    createInvoiceAction,
    {}
  );

  const costCenters = useMemo(() => dimensions.filter((d) => d.kind === "cost_center"), [dimensions]);
  const projects = useMemo(() => dimensions.filter((d) => d.kind === "project"), [dimensions]);

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0),
    [rows]
  );
  const total = subtotal + (Number(tax) || 0);

  const update = (key: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  };

  const removeRow = (key: number) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.ok} {state.invoiceNumber && <span dir="ltr">#{state.invoiceNumber}</span>}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">نوع فاکتور</span>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "sale" | "purchase")}
            className="w-full rounded-md border p-2"
          >
            <option value="sale">فروش</option>
            <option value="purchase">خرید</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">تاریخ فاکتور</span>
          <input
            name="invoice-date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-md border p-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">سررسید</span>
          <input name="due-date" type="date" className="w-full rounded-md border p-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">شمارهٔ فاکتور طرف مقابل</span>
          <input
            name="reference-number"
            dir="ltr"
            placeholder="اختیاری"
            className="w-full rounded-md border p-2"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">
            {kind === "sale" ? "خریدار" : "فروشنده"}
          </span>
          <input
            name="party-name"
            required
            placeholder="نام طرف حساب"
            className="w-full rounded-md border p-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">شناسه/کد اقتصادی</span>
          <input name="party-tax-id" dir="ltr" className="w-full rounded-md border p-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">
            {kind === "sale" ? "حساب دریافتنی (بدهکار)" : "حساب پرداختنی (بستانکار)"}
          </span>
          <select name="counterparty-account" required className="w-full rounded-md border p-2">
            <option value="">— انتخاب حساب —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </label>

        {/* Filled only when the counterparty is a party the ledger already knows. Both
            fields together, or neither: that is what puts the invoice on the party
            statement instead of leaving it as a name on a piece of paper. */}
        <label className="text-sm">
          <span className="mb-1 block font-medium">نوع طرف حساب (برای صورت‌حساب)</span>
          <select name="party-type" defaultValue="" className="w-full rounded-md border p-2">
            <option value="">— بدون اتصال —</option>
            <option value="user">کاربر</option>
            <option value="provider">ارائه‌دهنده</option>
            <option value="gateway">درگاه</option>
            <option value="platform">پلتفرم</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">شناسهٔ طرف حساب (UUID)</span>
          <input
            name="party-id"
            dir="ltr"
            placeholder="اختیاری"
            className="w-full rounded-md border p-2"
          />
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium">شرح فاکتور</span>
          <input
            name="description"
            placeholder="در صورت خالی بودن، شرح از شماره و نام طرف حساب ساخته می‌شود"
            className="w-full rounded-md border p-2"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs">
            <tr>
              <th className="p-2 text-start">شرح کالا / خدمت</th>
              <th className="p-2 text-start">
                {kind === "sale" ? "حساب درآمد" : "حساب هزینه / دارایی"}
              </th>
              <th className="p-2 text-start">مرکز هزینه</th>
              <th className="p-2 text-start">پروژه</th>
              <th className="p-2 text-start">تعداد</th>
              <th className="p-2 text-start">مبلغ واحد</th>
              <th className="p-2 text-start">جمع ردیف</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const account = accounts.find((a) => a.id === row.accountId);
              const lineAmount = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);

              return (
                <tr key={row.key} className="border-t">
                  <td className="p-1">
                    <input
                      name="line-description"
                      value={row.description}
                      onChange={(e) => update(row.key, { description: e.target.value })}
                      className="w-full min-w-40 rounded border p-1.5"
                    />
                  </td>
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
                      name="line-quantity"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => update(row.key, { quantity: e.target.value })}
                      className="w-full min-w-20 rounded border p-1.5 text-end"
                      dir="ltr"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      name="line-price"
                      inputMode="decimal"
                      value={row.unitPrice}
                      onChange={(e) => update(row.key, { unitPrice: e.target.value })}
                      className="w-full min-w-28 rounded border p-1.5 text-end"
                      dir="ltr"
                    />
                  </td>
                  <td className="text-muted-foreground p-2 text-end" dir="ltr">
                    {formatSum(lineAmount)}
                  </td>
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length <= 1}
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

      <div className="flex flex-wrap items-end justify-between gap-3">
        <button
          type="button"
          onClick={addRow}
          className="hover:bg-muted rounded-md border px-3 py-2 text-sm"
        >
          + افزودن ردیف
        </button>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">مالیات بر ارزش افزوده</span>
            <input
              name="tax-amount"
              inputMode="decimal"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-40 rounded-md border p-2 text-end"
              dir="ltr"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">حساب مالیات</span>
            <select name="tax-account" className="w-64 rounded-md border p-2">
              <option value="">—</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
        <span>
          جمع کل: <strong dir="ltr">{formatSum(subtotal)}</strong>
        </span>
        <span>
          مالیات: <strong dir="ltr">{formatSum(Number(tax) || 0)}</strong>
        </span>
        <span>
          مبلغ قابل پرداخت: <strong dir="ltr">{formatSum(total)}</strong> {baseCurrency}
        </span>
      </div>

      {/* Saved as a draft, exactly like a journal document: the ledger is touched only
          by "صدور فاکتور" on the list below, and even then the document it writes
          still has to be approved. */}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "در حال ذخیره…" : "ذخیرهٔ پیش‌نویس فاکتور"}
      </button>
    </form>
  );
}
