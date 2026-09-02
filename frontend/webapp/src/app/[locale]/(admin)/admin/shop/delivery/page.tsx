import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("delivery.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <p className="mb-4 max-w-3xl text-xs text-gray-500" dir="ltr">{t("delivery.hint")}</p>

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
            }}
          />
        ))}
        {!rows.length ? <p className="text-sm text-gray-400">{t("delivery.noMethods")}</p> : null}
      </div>
    </div>
  );
}
