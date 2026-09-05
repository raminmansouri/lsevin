import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listCouponsAdmin } from "@/features/shop/api/admin.repository";
import { deleteCouponAction } from "@/features/shop/actions/admin-catalog.actions";
import { CouponForm } from "@/features/shop/components/admin/CouponForm";
import { ShopDeleteButton } from "@/features/shop/components/admin/ShopDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const t = await getTranslations("ShopAdmin");
  const coupons = await listCouponsAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("coupons.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>
      <p className="mb-4 text-xs text-gray-500">{t("coupons.hint")}</p>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">{t("coupons.colCode")}</th>
                <th className="px-3 py-2">{t("coupons.colType")}</th>
                <th className="px-3 py-2">{t("coupons.colValue")}</th>
                <th className="px-3 py-2">{t("coupons.colMin")}</th>
                <th className="px-3 py-2">{t("coupons.colUsed")}</th>
                <th className="px-3 py-2">{t("coupons.colStatus")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono font-semibold">{c.code}</td>
                  <td className="px-3 py-2 text-xs">{c.coupon_type}</td>
                  <td className="px-3 py-2">
                    {c.coupon_type === "percentage" ? `${c.value}%` : c.coupon_type === "fixed" ? `${c.currency ?? ""} ${Number(c.value).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{c.currency ?? ""} {Number(c.min_subtotal).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{c.redemptions}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.is_active ? t("common.activeShort") : t("common.off")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <ShopDeleteButton
                      action={deleteCouponAction.bind(null, { id: c.id })}
                      title={`${t("coupons.disable")} — ${c.code}`}
                      description={t("coupons.title")}
                      label={t("coupons.disable")}
                      variant="ghost"
                    />
                  </td>
                </tr>
              ))}
              {!coupons.length ? <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">{t("coupons.noCoupons")}</td></tr> : null}
            </tbody>
          </table>
        </div>

        <CouponForm />
      </div>
    </div>
  );
}
