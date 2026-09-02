import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listBrandsAdmin } from "@/features/shop/api/admin.repository";
import { deleteBrandAction } from "@/features/shop/actions/admin-catalog.actions";
import { BrandForm } from "@/features/shop/components/admin/BrandForm";
import { ShopDeleteButton } from "@/features/shop/components/admin/ShopDeleteButton";

export const dynamic = "force-dynamic";

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
                    <ShopDeleteButton
                      action={deleteBrandAction.bind(null, { id: b.id })}
                      title={`${t("brands.archive")} — ${b.name}`}
                      description={t("brands.title")}
                      label={t("brands.archive")}
                      variant="ghost"
                    />
                  </td>
                </tr>
              ))}
              {!brands.length ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t("brands.noBrands")}</td></tr> : null}
            </tbody>
          </table>
        </div>

        <BrandForm />
      </div>
    </div>
  );
}
