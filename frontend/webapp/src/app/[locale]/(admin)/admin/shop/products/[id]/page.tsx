import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  getAdminProductForEdit,
  listAdminCategories,
  listAttributesAdmin,
  listServiceDefinitionsForPicker,
} from "@/features/shop/api/admin.repository";
import {
  linkProductServiceForm,
  unlinkProductServiceForm,
} from "@/features/shop/actions/admin.actions";
import {
  deleteVariantForm,
  removeProductAttributeForm,
  setProductAttributeForm,
  upsertVariantForm,
} from "@/features/shop/actions/admin-catalog.actions";
import { ProductCoreForm } from "@/features/shop/components/admin/ProductCoreForm";
import { ProductGalleryEditor } from "@/features/shop/components/admin/ProductGalleryEditor";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const RELATION = ["general", "recommended_before", "recommended_after", "compatible", "required", "optional_addon"];

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("ShopAdmin");
  const { id } = await params;
  const [product, categories, services, allAttributes] = await Promise.all([
    getAdminProductForEdit(id),
    listAdminCategories(),
    listServiceDefinitionsForPicker(),
    listAttributesAdmin(),
  ]);
  if (!product) notFound();
  const attachedIds = new Set((product.attributes ?? []).map((a: any) => a.attribute_id));

  const nt = product.name_translations ?? {};
  const dt = product.short_description_translations ?? {};
  const e = (k: string) => t(`productEdit.${k}` as never);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/products" className="text-sm font-medium text-[#083f30]">{t("nav.backToProducts")}</Link>
        <h1 className="text-xl font-bold text-gray-900">{nt.en || product.slug}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <ProductCoreForm
          product={{
            id: product.id,
            slug: product.slug,
            status: product.status,
            base_price: product.base_price,
            base_currency: product.base_currency,
            primary_category_id: product.primary_category_id,
            categoryIds: product.categoryIds,
            is_featured: product.is_featured,
            is_best_seller: product.is_best_seller,
            is_new_arrival: product.is_new_arrival,
            is_preorder: product.is_preorder,
            preorder_release_at: product.preorder_release_at,
            preorder_limit: product.preorder_limit,
            preorder_payment_policy: product.preorder_payment_policy,
            preorder_deposit_percent: product.preorder_deposit_percent,
            name_translations: nt,
            short_description_translations: dt,
          }}
          categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
        />

        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">{e("imagesTitle")}</h2>
            <ProductGalleryEditor productId={product.id} initialUrls={product.galleryUrls} />
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">{e("servicesTitle")}</h2>
            <ul className="mb-3 space-y-1">
              {product.serviceLinks.map((l: any) => (
                <li key={l.id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-sm">
                  <span className={l.broken ? "text-red-600" : ""}>
                    {l.service_name} <span className="text-gray-400">· {l.relation_type}</span>
                    {l.broken ? ` · ${e("brokenRef")}` : ""}
                  </span>
                  <form action={unlinkProductServiceForm}>
                    <input type="hidden" name="linkId" value={l.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="text-xs text-red-600">{t("common.remove")}</button>
                  </form>
                </li>
              ))}
              {!product.serviceLinks.length ? <li className="text-xs text-gray-400">{e("noServiceLinks")}</li> : null}
            </ul>
            <form action={linkProductServiceForm} className="space-y-2">
              <input type="hidden" name="productId" value={product.id} />
              <select name="serviceDefinitionId" className={input}>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}{s.is_active ? "" : ` (${t("common.inactiveShort")})`}</option>
                ))}
              </select>
              <select name="relationType" className={input}>
                {RELATION.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input name="displayOrder" type="number" defaultValue={0} className={input} />
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{e("addServiceLink")}</button>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">{e("variantsTitle")}</h2>
            <table className="mb-3 w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {(product.variants ?? []).map((v: any) => (
                  <tr key={v.id}>
                    <td className="py-1.5">
                      <span className="font-medium">{v.title || v.option_key}</span>
                      <span className="ms-1 font-mono text-xs text-gray-400">{v.sku}</span>
                    </td>
                    <td className="py-1.5 text-right">{v.currency} {Number(v.price).toFixed(2)}</td>
                    <td className="py-1.5 text-center text-xs text-gray-500">{t("productEdit.variantStock", { n: v.available })}</td>
                    <td className="py-1.5 text-center text-xs">{v.is_active ? t("common.activeShort") : t("common.off")}</td>
                    <td className="py-1.5 text-right">
                      <form action={deleteVariantForm}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <button className="text-xs text-red-600">{t("common.remove")}</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {!(product.variants ?? []).length ? <tr><td className="py-2 text-xs text-gray-400">{e("noVariants")}</td></tr> : null}
              </tbody>
            </table>
            <form action={upsertVariantForm} className="space-y-2">
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid grid-cols-3 gap-1">
                <input name="vtitle_en" placeholder={e("titleEn")} className={input} />
                <input name="vtitle_fa" placeholder={e("titleFa")} className={input} dir="rtl" />
                <input name="vtitle_ar" placeholder={e("titleAr")} className={input} dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input name="sku" placeholder={e("skuPlaceholder")} required className={input} />
                <input name="optionKey" placeholder={e("optionKeyPlaceholder")} className={input} />
              </div>
              <div className="grid grid-cols-3 gap-1">
                <input name="price" type="number" step="0.01" placeholder={e("pricePlaceholder")} required className={input} />
                <input name="currency" defaultValue={product.base_currency} className={input} />
                <input name="initialStock" type="number" placeholder={e("initialStockPlaceholder")} className={input} />
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" name="isActive" defaultChecked /> {t("common.activeShort")}</label>
                <label className="flex items-center gap-1"><input type="checkbox" name="allowBackorder" /> {e("allowBackorder")}</label>
              </div>
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{e("addVariant")}</button>
              <p className="text-xs text-gray-400">{e("variantNote")}</p>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">{e("attributesTitle")}</h2>
              <Link href="/admin/shop/attributes" className="text-xs font-medium text-[#083f30]">{e("manageAttributes")}</Link>
            </div>
            <ul className="mb-3 space-y-1">
              {(product.attributes ?? []).map((a: any) => (
                <li key={a.attribute_id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-sm">
                  <span>
                    {a.name} <span className="font-mono text-xs text-gray-400">{a.slug}</span>
                    {a.is_required ? <span className="ms-1 text-xs text-amber-600">{e("attrRequired")}</span> : null}
                    {a.is_variant_defining ? <span className="ms-1 text-xs text-emerald-600">{e("attrVariant")}</span> : null}
                    <span className="ms-1 text-xs text-gray-400">· {t("productEdit.attrOrder", { n: a.display_order })}</span>
                  </span>
                  <form action={removeProductAttributeForm}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="attributeId" value={a.attribute_id} />
                    <button className="text-xs text-red-600">{t("common.remove")}</button>
                  </form>
                </li>
              ))}
              {!(product.attributes ?? []).length ? <li className="text-xs text-gray-400">{e("noAttributesAttached")}</li> : null}
            </ul>
            <form action={setProductAttributeForm} className="space-y-2">
              <input type="hidden" name="productId" value={product.id} />
              <select name="attributeId" className={input}>
                {allAttributes
                  .filter((a: any) => !attachedIds.has(a.id))
                  .map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.slug})</option>
                  ))}
              </select>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="isRequired" /> {e("attrRequired")}</label>
                <input name="displayOrder" type="number" defaultValue={0} className="h-9 w-20 rounded border border-gray-300 px-2 text-sm" />
              </div>
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{e("attachAttribute")}</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
