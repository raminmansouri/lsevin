import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { listAttributesAdmin } from "@/features/shop/api/admin.repository";
import {
  deleteAttributeAction,
  deleteAttributeValueAction,
  updateAttributeValueForm,
  upsertAttributeForm,
} from "@/features/shop/actions/admin-catalog.actions";
import { AttributeForm } from "@/features/shop/components/admin/AttributeForm";
import { AttributeValueForm } from "@/features/shop/components/admin/AttributeValueForm";
import { ShopDeleteButton } from "@/features/shop/components/admin/ShopDeleteButton";

export const dynamic = "force-dynamic";

const LANGS = ["en", "fa", "ar"] as const;
const cellInput = "h-8 w-full rounded border border-gray-200 px-2 text-xs";

/**
 * SHP-ADM-007 — attributes and their values. `is_variant_defining` attributes
 * drive `product_variants.option_key`; the rest are spec/filter facets.
 */
export default async function AdminAttributesPage() {
  const t = await getTranslations("ShopAdmin");
  const attributes = await listAttributesAdmin(await getLocale());

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
                  description={
                    a.product_count > 0 ? t("attributes.deleteInUse", { n: a.product_count }) : t("attributes.title")
                  }
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

              {/* Existing names/labels were often saved without Arabic (the value form had no AR field), so the
                  storefront fell back to English. These forms fill in the missing languages in place. */}
              <details className="mt-3 rounded-xl border border-gray-100 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-[#083f30]">{t("attributes.editTranslations")}</summary>
                <form action={upsertAttributeForm} className="mt-3 grid gap-1.5 sm:grid-cols-[repeat(3,1fr),auto]">
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="slug" value={a.slug} />
                  <input type="hidden" name="displayType" value={a.display_type} />
                  {a.is_variant_defining ? <input type="hidden" name="isVariantDefining" value="on" /> : null}
                  {LANGS.map((lang) => (
                    <input
                      key={lang}
                      name={`name_${lang}`}
                      dir={lang === "en" ? "ltr" : "rtl"}
                      defaultValue={a.name_translations?.[lang] ?? ""}
                      placeholder={t(`attributes.name${lang === "en" ? "En" : lang === "fa" ? "Fa" : "Ar"}` as never)}
                      required={lang === "en"}
                      className={cellInput}
                    />
                  ))}
                  <button className="h-8 rounded bg-[#083f30] px-3 text-xs font-semibold text-white">{t("common.save")}</button>
                </form>
                {(a.values ?? []).map((v: any) => (
                  <form key={v.id} action={updateAttributeValueForm} className="mt-1.5 grid items-center gap-1.5 sm:grid-cols-[8rem,repeat(3,1fr),auto]">
                    <input type="hidden" name="id" value={v.id} />
                    <span className="truncate font-mono text-xs text-gray-500" dir="ltr">{v.value}</span>
                    {LANGS.map((lang) => (
                      <input
                        key={lang}
                        name={`label_${lang}`}
                        dir={lang === "en" ? "ltr" : "rtl"}
                        defaultValue={v.translations?.[lang] ?? ""}
                        placeholder={t(`attributes.label${lang === "en" ? "En" : lang === "fa" ? "Fa" : "Ar"}` as never)}
                        className={cellInput}
                      />
                    ))}
                    <button className="h-8 rounded bg-[#083f30]/10 px-3 text-xs font-semibold text-[#083f30]">{t("common.save")}</button>
                  </form>
                ))}
              </details>
            </section>
          ))}
          {!attributes.length ? <p className="text-sm text-gray-400">{t("attributes.noAttributes")}</p> : null}
        </div>

        <AttributeForm />
      </div>
    </div>
  );
}
