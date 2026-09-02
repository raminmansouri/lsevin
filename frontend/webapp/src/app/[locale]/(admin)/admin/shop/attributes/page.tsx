import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listAttributesAdmin } from "@/features/shop/api/admin.repository";
import {
  addAttributeValueForm,
  deleteAttributeForm,
  deleteAttributeValueForm,
  upsertAttributeForm,
} from "@/features/shop/actions/admin-catalog.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const DISPLAY_TYPES = ["select", "swatch", "text", "boolean"];

/**
 * SHP-ADM-007 — attributes and their values. `is_variant_defining` attributes
 * drive `product_variants.option_key`; the rest are spec/filter facets attached
 * to a product from the product editor.
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
                <form action={deleteAttributeForm}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-xs text-red-600" disabled={a.product_count > 0}>{t("attributes.delete")}</button>
                </form>
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                {(a.values ?? []).map((v: any) => (
                  <span key={v.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {v.colorHex ? <span className="h-3 w-3 rounded-full border" style={{ background: v.colorHex }} /> : null}
                    {v.name || v.value}
                    <form action={deleteAttributeValueForm} className="inline">
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-red-500">×</button>
                    </form>
                  </span>
                ))}
                {!(a.values ?? []).length ? <span className="text-xs text-gray-400">{t("attributes.noValuesYet")}</span> : null}
              </div>

              <form action={addAttributeValueForm} className="flex flex-wrap items-center gap-1.5">
                <input type="hidden" name="attributeId" value={a.id} />
                <input name="value" placeholder={t("attributes.valuePlaceholder")} required className="h-8 w-32 rounded border border-gray-300 px-2 text-xs" />
                <input name="label_en" placeholder={t("attributes.labelEn")} className="h-8 w-28 rounded border border-gray-300 px-2 text-xs" />
                <input name="label_fa" placeholder={t("attributes.labelFa")} dir="rtl" className="h-8 w-24 rounded border border-gray-300 px-2 text-xs" />
                <input name="colorHex" placeholder={t("attributes.hexPlaceholder")} className="h-8 w-20 rounded border border-gray-300 px-2 text-xs" />
                <button className="h-8 rounded bg-[#083f30] px-3 text-xs font-semibold text-white">{t("attributes.addValue")}</button>
              </form>
            </section>
          ))}
          {!attributes.length ? <p className="text-sm text-gray-400">{t("attributes.noAttributes")}</p> : null}
        </div>

        <section className="h-fit rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-900">{t("attributes.newAttribute")}</h2>
          <form action={upsertAttributeForm} className="space-y-2">
            <input name="name_en" placeholder={t("attributes.nameEn")} required className={input} />
            <div className="grid grid-cols-2 gap-2">
              <input name="name_fa" placeholder={t("attributes.nameFa")} dir="rtl" className={input} />
              <input name="name_ar" placeholder={t("attributes.nameAr")} dir="rtl" className={input} />
            </div>
            <input name="slug" placeholder={t("attributes.slugPlaceholder")} required className={input} />
            <select name="displayType" className={input}>
              {DISPLAY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isVariantDefining" /> {t("attributes.isVariantDefining")}
            </label>
            <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{t("attributes.createAttribute")}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
