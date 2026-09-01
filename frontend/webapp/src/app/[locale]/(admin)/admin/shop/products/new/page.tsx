import Link from "next/link";

import { listAdminCategories } from "@/features/shop/api/admin.repository";
import { createProductForm } from "@/features/shop/actions/admin-catalog.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export default async function AdminNewProductPage() {
  const categories = await listAdminCategories();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/products" className="text-sm font-medium text-[#083f30]">← Products</Link>
        <h1 className="text-xl font-bold text-gray-900">New product</h1>
      </div>

      <form action={createProductForm} className="max-w-2xl space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          <label className="text-sm">Name (EN)<input name="name_en" required className={input} /></label>
          <label className="text-sm">Name (FA)<input name="name_fa" className={input} dir="rtl" /></label>
          <label className="text-sm">Name (AR)<input name="name_ar" className={input} dir="rtl" /></label>
          <label className="text-sm">Short desc (EN)<input name="desc_en" className={input} /></label>
          <label className="text-sm">Short desc (FA)<input name="desc_fa" className={input} dir="rtl" /></label>
          <label className="text-sm">Short desc (AR)<input name="desc_ar" className={input} dir="rtl" /></label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <label className="text-sm">Slug<input name="slug" required pattern="[a-z0-9-]+" className={input} /></label>
          <label className="text-sm">Type
            <select name="productType" className={input} defaultValue="simple">
              <option value="simple">simple</option>
              <option value="variant">variant</option>
              <option value="digital">digital</option>
            </select>
          </label>
          <label className="text-sm">Source price<input name="basePrice" type="number" step="0.01" defaultValue={0} className={input} /></label>
          <label className="text-sm">Source currency<input name="baseCurrency" defaultValue="USD" className={input} /></label>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Categories (primary = radio)</p>
          <div className="flex flex-wrap gap-3">
            {categories.map((c: any) => (
              <label key={c.id} className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-sm">
                <input type="radio" name="primaryCategoryId" value={c.id} />
                <input type="checkbox" name="categoryIds" value={c.id} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">Create draft</button>
        <p className="text-xs text-gray-400">Created as draft. Add images and publish from the product page.</p>
      </form>
    </div>
  );
}
