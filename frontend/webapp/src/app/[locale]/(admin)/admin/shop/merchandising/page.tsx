import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getHomeSectionWithItems,
  listAdminCategories,
  listAdminProducts,
  listHomeSectionsAdmin,
} from "@/features/shop/api/admin.repository";
import {
  addHomeSectionItemForm,
  deleteHomeSectionAction,
  removeHomeSectionItemForm,
} from "@/features/shop/actions/admin-catalog.actions";
import { MediaUrlField } from "@/features/shop/components/admin/MediaUrlField";
import { HomeSectionForm } from "@/features/shop/components/admin/HomeSectionForm";
import { ShopDeleteButton } from "@/features/shop/components/admin/ShopDeleteButton";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export default async function AdminMerchandisingPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const t = await getTranslations("ShopAdmin");
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
        <h1 className="text-2xl font-bold text-gray-900">{t("merchandising.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>
      <p className="mb-4 text-xs text-gray-500">{t("merchandising.hint")}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.1fr]">
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">{t("merchandising.colKey")}</th>
                  <th className="px-3 py-2">{t("merchandising.colType")}</th>
                  <th className="px-3 py-2">{t("merchandising.colSource")}</th>
                  <th className="px-3 py-2">{t("merchandising.colItems")}</th>
                  <th className="px-3 py-2">{t("merchandising.colOrder")}</th>
                  <th></th>
                </tr>
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
                      <ShopDeleteButton
                        action={deleteHomeSectionAction.bind(null, { id: s.id })}
                        title={`${t("common.delete")} — ${s.key}`}
                        description={t("merchandising.title")}
                        variant="ghost"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <HomeSectionForm section={openSection ?? undefined} />
          {openSection ? (
            <Link href="/admin/shop/merchandising" className="inline-block text-xs font-medium text-[#083f30]">
              + {t("merchandising.newEditSection")}
            </Link>
          ) : null}
        </div>

        {openSection ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-gray-900">{t("merchandising.itemsIn", { key: openSection.key })}</h2>
            <ul className="mb-3 space-y-1">
              {openSection.items.map((it: any) => (
                <li key={it.id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-sm">
                  <span>{it.label || it.target_name || "—"} <span className="text-gray-400">#{it.display_order}</span></span>
                  <form action={removeHomeSectionItemForm}>
                    <input type="hidden" name="itemId" value={it.id} />
                    <button className="text-xs text-red-600">{t("common.remove")}</button>
                  </form>
                </li>
              ))}
              {!openSection.items.length ? <li className="text-xs text-gray-400">{t("merchandising.noItems")}</li> : null}
            </ul>

            {openSection.section_type === "product_rail" ? (
              <form action={addHomeSectionItemForm} className="space-y-2">
                <input type="hidden" name="sectionId" value={openSection.id} />
                <select name="productId" className={input}>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input name="displayOrder" type="number" defaultValue={0} className={input} placeholder={t("merchandising.orderPlaceholder")} />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{t("merchandising.addProduct")}</button>
              </form>
            ) : openSection.section_type === "shortcut_rail" ? (
              <form action={addHomeSectionItemForm} className="space-y-2">
                <input type="hidden" name="sectionId" value={openSection.id} />
                <select name="categoryId" className={input}>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input name="displayOrder" type="number" defaultValue={0} className={input} placeholder={t("merchandising.orderPlaceholder")} />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{t("merchandising.addCategoryShortcut")}</button>
              </form>
            ) : (
              <form action={addHomeSectionItemForm} className="space-y-2">
                <input type="hidden" name="sectionId" value={openSection.id} />
                <input name="label_en" placeholder={t("merchandising.labelEn")} className={input} />
                <input name="linkUrl" placeholder={t("merchandising.linkUrlPlaceholder")} className={input} />
                <MediaUrlField name="imageUrl" label={t("merchandising.image")} />
                <input name="displayOrder" type="number" defaultValue={0} className={input} placeholder={t("merchandising.orderPlaceholder")} />
                <button className="w-full rounded bg-[#083f30] px-3 py-2 text-sm font-semibold text-white">{t("merchandising.addPromoCard")}</button>
              </form>
            )}
          </section>
        ) : (
          <p className="text-sm text-gray-400">{t("merchandising.selectSection")}</p>
        )}
      </div>
    </div>
  );
}
