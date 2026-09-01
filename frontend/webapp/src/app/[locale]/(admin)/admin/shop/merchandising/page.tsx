import Link from "next/link";

import {
  getHomeSectionWithItems,
  listAdminCategories,
  listAdminProducts,
  listHomeSectionsAdmin,
} from "@/features/shop/api/admin.repository";
import {
  addHomeSectionItemForm,
  deleteHomeSectionForm,
  removeHomeSectionItemForm,
  upsertHomeSectionForm,
} from "@/features/shop/actions/admin-catalog.actions";
import { MediaUrlField } from "@/features/shop/components/admin/MediaUrlField";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const SECTION_TYPES = ["shortcut_rail", "promo_cards", "product_rail", "category_rail", "service_related_rail"];
const QUERY_SOURCES = ["manual", "featured", "best_seller", "new_arrival", "discounted", "category", "service_related"];

export default async function AdminMerchandisingPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: openSectionId } = await searchParams;
  const [sections, categories, products] = await Promise.all([
    listHomeSectionsAdmin(),
    listAdminCategories(),
    listAdminProducts(),
  ]);
  const openSection = openSectionId ? await getHomeSectionWithItems(openSectionId) : null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Home merchandising</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        `/shop` is composed entirely from these sections (SHP-DB-003, SHP-ADM-018) — no campaign is hardcoded in the frontend.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.1fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-3 py-2">Key</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Items</th><th className="px-3 py-2">Order</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sections.map((s: any) => (
                  <tr key={s.id} className={s.id === openSectionId ? "bg-[#083f30]/5" : ""}>
                    <td className="px-3 py-2"><Link href={`/admin/shop/merchandising?section=${s.id}`} className="font-medium text-[#083f30]">{s.key}</Link></td>
                    <td className="px-3 py-2 text-xs">{s.section_type}</td>
                    <td className="px-3 py-2 text-xs">{s.query_source}</td>
                    <td className="px-3 py-2">{s.item_count}</td>
                    <td className="px-3 py-2">{s.display_order}</td>
                    <td className="px-3 py-2">
                      <form action={deleteHomeSectionForm}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-xs text-red-600">delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={upsertHomeSectionForm} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">New / edit section</h2>
            {openSection ? <input type="hidden" name="id" value={openSection.id} /> : null}
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">Key<input name="key" defaultValue={openSection?.key ?? ""} required className={input} /></label>
              <label className="text-sm">Display order<input name="displayOrder" type="number" defaultValue={openSection?.display_order ?? 0} className={input} /></label>
              <label className="text-sm">Type
                <select name="sectionType" defaultValue={openSection?.section_type ?? "product_rail"} className={input}>
                  {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="text-sm">Query source
                <select name="querySource" defaultValue={openSection?.query_source ?? "manual"} className={input}>
                  {QUERY_SOURCES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="text-sm">Category slug (for query_source=category)
                <input name="categorySlug" defaultValue={openSection?.query_config?.slug ?? ""} className={input} />
              </label>
              <label className="mt-5 flex items-center gap-1 text-sm"><input type="checkbox" name="isActive" defaultChecked={openSection?.is_active ?? true} /> active</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">Title (EN)<input name="title_en" defaultValue={openSection?.title_translations?.en ?? ""} className={input} /></label>
              <label className="text-sm">Title (FA)<input name="title_fa" defaultValue={openSection?.title_translations?.fa ?? ""} className={input} dir="rtl" /></label>
              <label className="text-sm">Title (AR)<input name="title_ar" defaultValue={openSection?.title_translations?.ar ?? ""} className={input} dir="rtl" /></label>
            </div>
            <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">Save section</button>
          </form>
        </div>

        {openSection ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">Items in "{openSection.key}"</h2>
            <ul className="mb-3 space-y-1">
              {openSection.items.map((it: any) => (
                <li key={it.id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-sm">
                  <span>{it.label || it.target_name || "—"} <span className="text-gray-400">#{it.display_order}</span></span>
                  <form action={removeHomeSectionItemForm}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <button className="text-xs text-red-600">remove</button>
                  </form>
                </li>
              ))}
              {!openSection.items.length ? <li className="text-xs text-gray-400">No items yet.</li> : null}
            </ul>

            {openSection.section_type === "product_rail" ? (
              <form action={addHomeSectionItemForm} className="space-y-2">
                <input type="hidden" name="sectionId" value={openSection.id} />
                <select name="productId" className={input}>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input name="displayOrder" type="number" defaultValue={0} className={input} placeholder="order" />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Add product</button>
              </form>
            ) : openSection.section_type === "shortcut_rail" ? (
              <form action={addHomeSectionItemForm} className="space-y-2">
                <input type="hidden" name="sectionId" value={openSection.id} />
                <select name="categoryId" className={input}>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input name="displayOrder" type="number" defaultValue={0} className={input} placeholder="order" />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Add category shortcut</button>
              </form>
            ) : (
              <form action={addHomeSectionItemForm} className="space-y-2">
                <input type="hidden" name="sectionId" value={openSection.id} />
                <input name="label_en" placeholder="Label (EN)" className={input} />
                <input name="linkUrl" placeholder="Link URL (e.g. /n/app/mobile/shop/category/wellness)" className={input} />
                <MediaUrlField name="imageUrl" label="Image" />
                <input name="displayOrder" type="number" defaultValue={0} className={input} placeholder="order" />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">Add promo card</button>
              </form>
            )}
          </section>
        ) : (
          <p className="text-sm text-gray-400">Select a section to manage its items.</p>
        )}
      </div>
    </div>
  );
}
