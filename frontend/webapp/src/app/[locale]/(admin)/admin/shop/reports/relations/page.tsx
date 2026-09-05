import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getServiceRelationReport } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

/**
 * SHP-V02-019 — product ↔ service relation performance. Reads the append-only
 * shop.analytics_events sink: impressions from `shop_related_service_product_impression`
 * (quantity = products shown), clicks from `shop_related_service_product_click`.
 */
export default async function AdminRelationReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const t = await getTranslations("ShopAdmin");
  const { days } = await searchParams;
  const window = Number(days) || 90;
  const rows = await getServiceRelationReport(window);

  const totals = rows.reduce(
    (a, r) => ({ impressions: a.impressions + r.impressions, clicks: a.clicks + r.clicks }),
    { impressions: 0, clicks: 0 },
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("reportRelations.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <div className="mb-4 flex gap-2 text-xs">
        {[30, 90, 180, 365].map((d) => (
          <Link
            key={d}
            href={`/admin/shop/reports/relations?days=${d}`}
            className={`rounded px-2 py-1 ${window === d ? "bg-[#083f30] text-white" : "bg-white ring-1 ring-gray-200"}`}
          >
            {d}d
          </Link>
        ))}
      </div>

      <p className="mb-3 text-xs text-gray-500">{t("reportRelations.explainer")}</p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t("reportRelations.impressions")} value={totals.impressions} />
        <Stat label={t("reportRelations.clicks")} value={totals.clicks} />
        <Stat
          label={t("reportRelations.overallCtr")}
          value={totals.impressions ? `${((totals.clicks / totals.impressions) * 100).toFixed(1)}%` : "—"}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("reportRelations.colService")}</th>
              <th className="px-4 py-3">{t("reportRelations.colImpressions")}</th>
              <th className="px-4 py-3">{t("reportRelations.colRailViews")}</th>
              <th className="px-4 py-3">{t("reportRelations.colClicks")}</th>
              <th className="px-4 py-3">{t("reportRelations.colCtr")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.service_definition_id}>
                <td className="px-4 py-3 font-medium text-gray-900">{r.service_name}</td>
                <td className="px-4 py-3">{r.impressions}</td>
                <td className="px-4 py-3 text-gray-500">{r.impression_events}</td>
                <td className="px-4 py-3">{r.clicks}</td>
                <td className="px-4 py-3 font-semibold text-[#083f30]">
                  {r.ctr === null ? "—" : `${(r.ctr * 100).toFixed(1)}%`}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t("reportRelations.noEvents")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
