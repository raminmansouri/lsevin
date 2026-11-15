import Link from "next/link";
import { getTranslations } from "next-intl/server";

import sql from "@/config/database/db";
import { saveSellerFeeCapForm } from "@/features/shop/actions/fulfilment-admin.actions";
import { listDeliveryMethodsAdmin } from "@/features/shop/api/admin.repository";
import { DeliveryMethodForm } from "@/features/shop/components/admin/DeliveryMethodForm";

export const dynamic = "force-dynamic";

/**
 * SHP-V03-012 — delivery methods with geographic eligibility, surcharges and ETA
 * overrides. Rules live in `shop.delivery_methods.rules` and are enforced
 * server-side in `getDeliveryOptions` / `isDeliveryMethodEligible`.
 */
export default async function AdminDeliveryPage() {
  const t = await getTranslations("ShopAdmin");
  const rows = await listDeliveryMethodsAdmin();
  const [settings] = await sql<{ cap: string | null }[]>`select seller_fee_cap::text as cap from shop.shipping_settings where id`;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("delivery.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <p className="mb-4 max-w-3xl text-xs text-gray-500" dir="ltr">{t("delivery.hint")}</p>

      {/* Sellers (clinics) set their own shipping fee in the portal; this caps what they may charge. */}
      <form action={saveSellerFeeCapForm} className="mb-4 max-w-xl rounded-2xl border border-gray-100 bg-white p-4 shadow-sm" data-testid="seller-fee-cap">
        <label className="block text-sm font-bold text-gray-900" htmlFor="seller-fee-cap">{t("delivery.feeCapTitle" as never)}</label>
        <p className="mt-1 text-xs text-gray-500">{t("delivery.feeCapHint" as never)}</p>
        <div className="mt-2 flex gap-2">
          <input
            id="seller-fee-cap"
            name="cap"
            inputMode="numeric"
            defaultValue={settings?.cap ? String(Math.trunc(Number(settings.cap))) : ""}
            placeholder={t("delivery.feeCapPlaceholder" as never)}
            className="h-9 flex-1 rounded border border-gray-300 px-2 text-sm"
            dir="ltr"
          />
          <button className="rounded bg-[#083f30] px-3 py-1.5 text-sm font-semibold text-white">{t("delivery.feeCapSave" as never)}</button>
        </div>
      </form>

      <div className="space-y-4">
        {rows.map((m: any) => (
          <DeliveryMethodForm
            key={m.id}
            method={{
              id: m.id,
              code: m.code,
              name: m.name,
              base_fee: m.base_fee,
              is_active: m.is_active,
              estimated_days_min: m.estimated_days_min,
              estimated_days_max: m.estimated_days_max,
              rules: m.rules,
              supports_pickup: Boolean(m.supports_pickup),
              office: {
                addressFa: m.office_address_fa ?? "",
                addressEn: m.office_address_en ?? "",
                phone: m.office_phone ?? "",
                hoursFa: m.office_hours_fa ?? "",
                hoursEn: m.office_hours_en ?? "",
              },
            }}
          />
        ))}
        {!rows.length ? <p className="text-sm text-gray-400">{t("delivery.noMethods")}</p> : null}
      </div>
    </div>
  );
}
