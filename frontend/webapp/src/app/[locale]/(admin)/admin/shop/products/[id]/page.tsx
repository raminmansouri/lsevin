import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAdminProductForEdit,
  listAdminCategories,
  listServiceDefinitionsForPicker,
} from "@/features/shop/api/admin.repository";
import {
  linkProductServiceForm,
  unlinkProductServiceForm,
  updateProductCoreForm,
} from "@/features/shop/actions/admin.actions";
import { deleteVariantForm, upsertVariantForm } from "@/features/shop/actions/admin-catalog.actions";
import { ProductGalleryEditor } from "@/features/shop/components/admin/ProductGalleryEditor";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const RELATION = ["general", "recommended_before", "recommended_after", "compatible", "required", "optional_addon"];

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, services] = await Promise.all([
    getAdminProductForEdit(id),
    listAdminCategories(),
    listServiceDefinitionsForPicker(),
  ]);
  if (!product) notFound();

  const nt = product.name_translations ?? {};
  const dt = product.short_description_translations ?? {};

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/products" className="text-sm font-medium text-[#083f30]">← Products</Link>
        <h1 className="text-xl font-bold text-gray-900">{nt.en || product.slug}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <form action={updateProductCoreForm} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <input type="hidden" name="productId" value={product.id} />
          <div className="grid grid-cols-3 gap-2">
            <label className="col-span-1 text-sm">Name (EN)<input name="name_en" defaultValue={nt.en ?? ""} className={input} /></label>
            <label className="col-span-1 text-sm">Name (FA)<input name="name_fa" defaultValue={nt.fa ?? ""} className={input} dir="rtl" /></label>
            <label className="col-span-1 text-sm">Name (AR)<input name="name_ar" defaultValue={nt.ar ?? ""} className={input} dir="rtl" /></label>
            <label className="col-span-1 text-sm">Short desc (EN)<input name="desc_en" defaultValue={dt.en ?? ""} className={input} /></label>
            <label className="col-span-1 text-sm">Short desc (FA)<input name="desc_fa" defaultValue={dt.fa ?? ""} className={input} dir="rtl" /></label>
            <label className="col-span-1 text-sm">Short desc (AR)<input name="desc_ar" defaultValue={dt.ar ?? ""} className={input} dir="rtl" /></label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <label className="text-sm">Slug<input name="slug" defaultValue={product.slug} className={input} /></label>
            <label className="text-sm">Price<input name="basePrice" type="number" step="0.01" defaultValue={product.base_price} className={input} /></label>
            <label className="text-sm">Source currency<input name="baseCurrency" defaultValue={product.base_currency} className={input} /></label>
            <label className="text-sm">Status
              <select name="status" defaultValue={product.status} className={input}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Categories (primary = radio)</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((c: any) => (
                <label key={c.id} className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-sm">
                  <input type="radio" name="primaryCategoryId" value={c.id} defaultChecked={product.primary_category_id === c.id} />
                  <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={product.categoryIds.includes(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1"><input type="checkbox" name="isFeatured" defaultChecked={product.is_featured} /> featured</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="isBestSeller" defaultChecked={product.is_best_seller} /> best-seller</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="isNewArrival" defaultChecked={product.is_new_arrival} /> new</label>
          </div>
          <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">Save product</button>
          <p className="text-xs text-gray-400">Publish/unpublish never deletes order history (SHP-ADM-008). Variant editor is a later increment.</p>
        </form>

        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">Product images (SHP-ADM-005)</h2>
            <ProductGalleryEditor productId={product.id} initialUrls={product.galleryUrls} />
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">Linked LSevin services (SHP-V01-032)</h2>
            <ul className="mb-3 space-y-1">
              {product.serviceLinks.map((l: any) => (
                <li key={l.id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-sm">
                  <span className={l.broken ? "text-red-600" : ""}>
                    {l.service_name} <span className="text-gray-400">· {l.relation_type}</span>
                    {l.broken ? " · broken ref" : ""}
                  </span>
                  <form action={unlinkProductServiceForm}>
                    <input type="hidden" name="linkId" value={l.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="text-xs text-red-600">remove</button>
                  </form>
                </li>
              ))}
              {!product.serviceLinks.length ? <li className="text-xs text-gray-400">No service links.</li> : null}
            </ul>
            <form action={linkProductServiceForm} className="space-y-2">
              <input type="hidden" name="productId" value={product.id} />
              <select name="serviceDefinitionId" className={input}>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}{s.is_active ? "" : " (inactive)"}</option>
                ))}
              </select>
              <select name="relationType" className={input}>
                {RELATION.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input name="displayOrder" type="number" defaultValue={0} className={input} />
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Add service link</button>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">Variants / SKUs (SHP-ADM-004)</h2>
            <table className="mb-3 w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {(product.variants ?? []).map((v: any) => (
                  <tr key={v.id}>
                    <td className="py-1.5">
                      <span className="font-medium">{v.title || v.option_key}</span>
                      <span className="ms-1 font-mono text-xs text-gray-400">{v.sku}</span>
                    </td>
                    <td className="py-1.5 text-right">{v.currency} {Number(v.price).toFixed(2)}</td>
                    <td className="py-1.5 text-center text-xs text-gray-500">stock {v.available}</td>
                    <td className="py-1.5 text-center text-xs">{v.is_active ? "active" : "off"}</td>
                    <td className="py-1.5 text-right">
                      <form action={deleteVariantForm}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <button className="text-xs text-red-600">remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {!(product.variants ?? []).length ? <tr><td className="py-2 text-xs text-gray-400">No variants — this is a simple product.</td></tr> : null}
              </tbody>
            </table>
            <form action={upsertVariantForm} className="space-y-2">
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid grid-cols-3 gap-1">
                <input name="vtitle_en" placeholder="Title EN" className={input} />
                <input name="vtitle_fa" placeholder="عنوان" className={input} dir="rtl" />
                <input name="vtitle_ar" placeholder="عنوان" className={input} dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input name="sku" placeholder="SKU (unique)" required className={input} />
                <input name="optionKey" placeholder="option key (e.g. color:red)" className={input} />
              </div>
              <div className="grid grid-cols-3 gap-1">
                <input name="price" type="number" step="0.01" placeholder="price" required className={input} />
                <input name="currency" defaultValue={product.base_currency} className={input} />
                <input name="initialStock" type="number" placeholder="initial stock" className={input} />
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" name="isActive" defaultChecked /> active</label>
                <label className="flex items-center gap-1"><input type="checkbox" name="allowBackorder" /> allow backorder</label>
              </div>
              <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Add variant</button>
              <p className="text-xs text-gray-400">Adding the first variant switches the product to a variant product; a variant sells only while active (SHP-CAT-004).</p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
