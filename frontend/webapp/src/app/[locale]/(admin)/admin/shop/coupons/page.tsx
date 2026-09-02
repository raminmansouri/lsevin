import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listCouponsAdmin } from "@/features/shop/api/admin.repository";
import { deleteCouponForm, upsertCouponForm } from "@/features/shop/actions/admin-catalog.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

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
                  <td className="px-3 py-2">
                    <form action={deleteCouponForm}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-red-600">{t("coupons.disable")}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!coupons.length ? <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">{t("coupons.noCoupons")}</td></tr> : null}
            </tbody>
          </table>
        </div>

        <form action={upsertCouponForm} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">{t("coupons.new")}</h2>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">{t("coupons.code")}<input name="code" required className={input} /></label>
            <label className="text-sm">{t("coupons.type")}
              <select name="couponType" className={input}>
                <option value="percentage">percentage</option>
                <option value="fixed">fixed</option>
                <option value="free_shipping">free_shipping</option>
              </select>
            </label>
            <label className="text-sm">{t("coupons.value")}<input name="value" type="number" step="0.01" defaultValue={0} className={input} /></label>
            <label className="text-sm">{t("coupons.currencyFixedOnly")}<input name="currency" placeholder="USD" className={input} /></label>
            <label className="text-sm">{t("coupons.minSubtotal")}<input name="minSubtotal" type="number" step="0.01" defaultValue={0} className={input} /></label>
            <label className="text-sm">{t("coupons.maxDiscount")}<input name="maxDiscountAmount" type="number" step="0.01" className={input} /></label>
            <label className="text-sm">{t("coupons.usageLimit")}<input name="usageLimit" type="number" className={input} /></label>
            <label className="text-sm">{t("coupons.perCustomer")}<input name="usagePerCustomer" type="number" className={input} /></label>
            <label className="text-sm">{t("coupons.scope")}
              <select name="scope" className={input}>
                <option value="cart">cart</option>
                <option value="shipping">shipping</option>
                <option value="product">product</option>
                <option value="category">category</option>
                <option value="brand">brand</option>
              </select>
            </label>
            <label className="text-sm">{t("coupons.startsAt")}<input name="startsAt" type="datetime-local" className={input} /></label>
            <label className="text-sm">{t("coupons.expiresAt")}<input name="expiresAt" type="datetime-local" className={input} /></label>
            <label className="mt-5 flex items-center gap-1 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {t("coupons.active")}</label>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <input name="title_en" placeholder={t("coupons.titleEn")} className={input} />
            <input name="title_fa" placeholder={t("coupons.titleFa")} className={input} dir="rtl" />
            <input name="title_ar" placeholder={t("coupons.titleAr")} className={input} dir="rtl" />
          </div>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="stackable" /> {t("coupons.stackable")}</label>
          <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">{t("coupons.save")}</button>
        </form>
      </div>
    </div>
  );
}
