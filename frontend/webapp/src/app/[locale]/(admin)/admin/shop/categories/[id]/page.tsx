import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  getCategoryForEdit,
  listAdminCategories,
  listServiceDefinitionsForPicker,
} from "@/features/shop/api/admin.repository";
import { CategoryForm } from "@/features/shop/components/admin/CategoryForm";
import {
  deleteCategoryForm,
  linkCategoryServiceForm,
  unlinkCategoryServiceForm,
} from "@/features/shop/actions/admin-catalog.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";
const RELATION = ["general", "recommended_before", "recommended_after", "compatible", "required", "optional_addon"];

export default async function AdminCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("ShopAdmin");
  const { id } = await params;
  const [category, categories, services] = await Promise.all([
    getCategoryForEdit(id),
    listAdminCategories(),
    listServiceDefinitionsForPicker(),
  ]);
  if (!category) notFound();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/categories" className="text-sm font-medium text-[#083f30]">{t("nav.backToCategories")}</Link>
        <h1 className="text-xl font-bold text-gray-900">{category.name_translations?.en || category.slug}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="space-y-4">
          <CategoryForm category={category} categories={categories} />
          <form action={deleteCategoryForm}>
            <input type="hidden" name="id" value={category.id} />
            <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">{t("categoryEdit.delete")}</button>
          </form>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-gray-900">{t("categoryEdit.servicesTitle")}</h2>
          <ul className="mb-3 space-y-1">
            {category.serviceLinks.map((l: any) => (
              <li key={l.id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-sm">
                <span className={l.broken ? "text-red-600" : ""}>
                  {l.service_name} <span className="text-gray-400">· {l.relation_type}</span>
                  {l.broken ? ` · ${t("categoryEdit.brokenRef")}` : ""}
                </span>
                <form action={unlinkCategoryServiceForm}>
                  <input type="hidden" name="linkId" value={l.id} />
                  <input type="hidden" name="shopCategoryId" value={category.id} />
                  <button className="text-xs text-red-600">{t("common.remove")}</button>
                </form>
              </li>
            ))}
            {!category.serviceLinks.length ? <li className="text-xs text-gray-400">{t("categoryEdit.noServiceLinks")}</li> : null}
          </ul>
          <form action={linkCategoryServiceForm} className="space-y-2">
            <input type="hidden" name="shopCategoryId" value={category.id} />
            <select name="serviceDefinitionId" className={input}>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}{s.is_active ? "" : ` (${t("common.inactiveShort")})`}</option>
              ))}
            </select>
            <select name="relationType" className={input}>
              {RELATION.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{t("categoryEdit.addServiceLink")}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
