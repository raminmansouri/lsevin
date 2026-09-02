import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listBrandsAdmin } from "@/features/shop/api/admin.repository";
import { deleteBrandForm, upsertBrandForm } from "@/features/shop/actions/admin-catalog.actions";
import { MediaUrlField } from "@/features/shop/components/admin/MediaUrlField";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export default async function AdminBrandsPage() {
  const t = await getTranslations("ShopAdmin");
  const brands = await listBrandsAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("brands.title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("brands.colBrand")}</th>
                <th className="px-4 py-3">{t("brands.colSlug")}</th>
                <th className="px-4 py-3">{t("brands.colStatus")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map((b: any) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    {b.logo_url ? <img src={b.logo_url} alt="" className="me-2 inline-block h-6 w-6 rounded object-cover align-middle" /> : null}
                    {b.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {b.is_active ? t("common.activeShort") : t("common.inactiveShort")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteBrandForm}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-xs text-red-600">{t("brands.archive")}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!brands.length ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t("brands.noBrands")}</td></tr> : null}
            </tbody>
          </table>
        </div>

        <form action={upsertBrandForm} className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">{t("brands.add")}</h2>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">{t("brands.nameEn")}<input name="name_en" required className={input} /></label>
            <label className="text-sm">{t("brands.nameFa")}<input name="name_fa" className={input} dir="rtl" /></label>
            <label className="text-sm">{t("brands.nameAr")}<input name="name_ar" className={input} dir="rtl" /></label>
          </div>
          <label className="block text-sm">{t("brands.slug")}<input name="slug" required pattern="[a-z0-9-]+" className={input} /></label>
          <label className="block text-sm">{t("brands.website")}<input name="websiteUrl" type="url" className={input} /></label>
          <MediaUrlField name="logoUrl" label={t("brands.logo")} />
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {t("brands.active")}</label>
          <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">{t("brands.save")}</button>
        </form>
      </div>
    </div>
  );
}
