import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listReturnRequests } from "@/features/shop/api/admin.repository";
import { receiveReturnForm, reviewReturnForm } from "@/features/shop/actions/returns.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const STATUSES = ["requested", "approved", "rejected", "received", "refunded", "all"];

export default async function AdminReturnsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getTranslations("ShopAdmin");
  const { status } = await searchParams;
  const cur = status || "requested";
  const rows = await listReturnRequests(cur);

  const returnStatus = (v: string) => (t.has(`enum.returnStatus.${v}` as never) ? t(`enum.returnStatus.${v}` as never) : v);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("returns.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/shop/returns?status=${s}`} className={`rounded px-2 py-1 ${cur === s ? "bg-[#083f30] text-white" : "bg-white ring-1 ring-gray-200"}`}>
            {returnStatus(s)}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((r: any) => (
          <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <Link href={`/admin/shop/orders/${r.order_id}`} className="font-mono font-semibold text-[#083f30]">{r.order_number}</Link>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{returnStatus(r.status)}</span>
            </div>
            <p className="mt-1 text-gray-600">{r.reason}</p>
            <ul className="mt-1 text-xs text-gray-500">
              {(r.items ?? []).map((it: any, i: number) => (
                <li key={i}>· {it.name} ×{it.quantity}{it.reason ? ` — ${it.reason}` : ""}</li>
              ))}
            </ul>
            {r.review_note ? <p className="mt-1 text-xs text-amber-700">{r.review_note}</p> : null}

            {r.status === "requested" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={reviewReturnForm}>
                  <input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="approved" />
                  <button className="rounded bg-green-700 px-3 py-1 text-xs font-semibold text-white">{t("returns.approve")}</button>
                </form>
                <form action={reviewReturnForm} className="flex gap-1">
                  <input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="rejected" />
                  <input name="note" placeholder={t("returns.rejectReasonPlaceholder")} className={input} required />
                  <button className="rounded bg-red-700 px-3 text-xs font-semibold text-white">{t("returns.reject")}</button>
                </form>
              </div>
            ) : r.status === "approved" ? (
              <form action={receiveReturnForm} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="restock" defaultChecked /> {t("returns.restockItems")}</label>
                <button className="rounded bg-[#083f30] px-3 py-1 text-xs font-semibold text-white">{t("returns.markReceived")}</button>
              </form>
            ) : null}
          </div>
        ))}
        {!rows.length ? <p className="rounded-xl bg-white p-8 text-center text-xs text-gray-400">{t("common.nothingHere")}</p> : null}
      </div>
      <p className="mt-3 text-xs text-gray-400">{t("returns.footnote")}</p>
    </div>
  );
}
