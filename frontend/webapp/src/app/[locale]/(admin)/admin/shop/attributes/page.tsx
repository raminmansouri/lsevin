import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listAttributesAdmin } from "@/features/shop/api/admin.repository";
import { deleteAttributeAction, deleteAttributeValueAction } from "@/features/shop/actions/admin-catalog.actions";
import { AttributeForm } from "@/features/shop/components/admin/AttributeForm";
import { AttributeValueForm } from "@/features/shop/components/admin/AttributeValueForm";
import { ShopDeleteButton } from "@/features/shop/components/admin/ShopDeleteButton";

export const dynamic = "force-dynamic";

/**
 * SHP-ADM-007 — attributes and their values. `is_variant_defining` attributes
 * drive `product_variants.option_key`; the rest are spec/filter facets.
 */
export default async function AdminAttributesPage() {
  const t = await getTranslations("ShopAdmin");
  const attributes = await listAttributesAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("attributes.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4">
          {attributes.map((a: any) => (
            <section key={a.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">{a.name}</span>
                  <span className="ms-2 font-mono text-xs text-gray-400">{a.slug}</span>
                  <span className="ms-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{a.display_type}</span>
                  {a.is_variant_defining ? (
                    <span className="ms-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{t("attributes.variantDefining")}</span>
                  ) : null}
                  <span className="ms-2 text-xs text-gray-400">{t("attributes.productCount", { n: a.product_count })}</span>
                </div>
                <ShopDeleteButton
                  action={deleteAttributeAction.bind(null, { id: a.id })}
                  title={`${t("attributes.delete")} — ${a.name}`}
                  description={t("attributes.title")}
                  disabled={a.product_count > 0}
                  variant="ghost"
                />
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {(a.values ?? []).map((v: any) => (
                  <span key={v.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {v.colorHex ? <span className="h-3 w-3 rounded-full border" style={{ background: v.colorHex }} /> : null}
                    {v.name || v.value}
                    <ShopDeleteButton
                      action={deleteAttributeValueAction.bind(null, { id: v.id })}
                      title={`${t("common.delete")} — ${v.name || v.value}`}
                      description={a.name}
                      label="×"
                      variant="ghost"
                    />
                  </span>
                ))}
                {!(a.values ?? []).length ? <span className="text-xs text-gray-400">{t("attributes.noValuesYet")}</span> : null}
              </div>

              <AttributeValueForm attributeId={a.id} />
            </section>
          ))}
          {!attributes.length ? <p className="text-sm text-gray-400">{t("attributes.noAttributes")}</p> : null}
        </div>

        <AttributeForm />
      </div>
    </div>
  );
}
