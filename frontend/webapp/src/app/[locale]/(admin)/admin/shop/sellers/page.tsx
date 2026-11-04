import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listSellersAdmin } from "@/features/shop/api/admin.repository";
import { deleteSellerAction } from "@/features/shop/actions/admin-catalog.actions";
import { SellerForm } from "@/features/shop/components/admin/SellerForm";
import { ShopDeleteButton } from "@/features/shop/components/admin/ShopDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const t = await getTranslations("ShopAdmin");
  const { edit } = await searchParams;
  const sellers = await listSellersAdmin();
  const editing = edit ? sellers.find((s: any) => s.id === edit) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("sellers.title")}</h1>
        <div className="flex items-center gap-3">
          {editing ? (
            <Link href="/admin/shop/sellers" className="rounded-lg bg-[#083f30] px-3 py-1.5 text-sm font-semibold text-white">{t("sellers.add")}</Link>
          ) : null}
          <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("sellers.colSeller")}</th>
                <th className="px-4 py-3">{t("sellers.colOffers")}</th>
                <th className="px-4 py-3">{t("sellers.colStatus")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sellers.map((s: any) => (
                <tr key={s.id} className={editing?.id === s.id ? "bg-[#083f30]/5" : ""}>
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.logo_url ? <img src={s.logo_url} alt="" className="me-2 inline-block h-6 w-6 rounded object-cover align-middle" /> : null}
                    <Link href={`/admin/shop/sellers?edit=${s.id}`} className="font-medium text-[#083f30] hover:underline">{s.name}</Link>
                    {s.is_default ? <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{t("sellers.default")}</span> : null}
                    <div className="font-mono text-xs text-gray-400">{s.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/shop/sellers/${s.id}`} className="font-medium text-[#083f30] hover:underline">
                      {t("sellerOffers.manage", { count: s.offer_count })}
                    </Link>
                    {s.low_stock_count > 0 ? (
                      <span className="ms-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        {t("sellerOffers.lowStockCount", { count: s.low_stock_count })}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {s.is_active ? t("common.activeShort") : t("common.inactiveShort")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.offer_count > 0 ? (
                      <span className="text-xs text-gray-400" title={t("sellers.deleteBlocked")}>{t("sellers.archive")}</span>
                    ) : (
                      <ShopDeleteButton
                        action={deleteSellerAction.bind(null, { id: s.id })}
                        title={`${t("sellers.archive")} — ${s.name}`}
                        description={t("sellers.title")}
                        label={t("sellers.archive")}
                        variant="ghost"
                      />
                    )}
                  </td>
                </tr>
              ))}
              {!sellers.length ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t("sellers.noSellers")}</td></tr> : null}
            </tbody>
          </table>
        </div>

        <SellerForm key={editing?.id ?? "new"} seller={editing} />
      </div>
    </div>
  );
}