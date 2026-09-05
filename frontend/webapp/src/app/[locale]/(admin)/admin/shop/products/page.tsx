import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listAdminProducts } from "@/features/shop/api/admin.repository";
import { setProductPublishedForm } from "@/features/shop/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("ShopAdmin");
  const { q } = await searchParams;
  const rows = await listAdminProducts(q);

  const productStatus = (v: string) => (t.has(`enum.productStatus.${v}` as never) ? t(`enum.productStatus.${v}` as never) : v);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("products.title")}</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/shop/products/new" className="rounded-lg bg-[#083f30] px-3 py-1.5 text-sm font-semibold text-white">{t("products.new")}</Link>
          <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
        </div>
      </div>

      <form method="get" className="mb-4">
        <input name="q" defaultValue={q ?? ""} placeholder={t("products.searchPlaceholder")} className="h-9 w-64 rounded-lg border border-gray-200 px-3 text-sm" />
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("products.colProduct")}</th>
              <th className="px-4 py-3">{t("products.colSlug")}</th>
              <th className="px-4 py-3">{t("products.colSourcePrice")}</th>
              <th className="px-4 py-3">{t("products.colAvailable")}</th>
              <th className="px-4 py-3">{t("products.colBadges")}</th>
              <th className="px-4 py-3">{t("products.colStatus")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/admin/shop/products/${p.id}`} className="text-[#083f30] hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.slug}</td>
                <td className="px-4 py-3">{p.currency} {Number(p.base_price).toFixed(2)}</td>
                <td className={`px-4 py-3 ${p.available <= 5 ? "text-amber-600" : "text-gray-600"}`}>{p.available}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {[
                    p.is_featured && t("products.badgeFeatured"),
                    p.is_best_seller && t("products.badgeBestSeller"),
                    p.is_new_arrival && t("products.badgeNew"),
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {productStatus(p.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={setProductPublishedForm}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="published" value={p.status === "active" ? "false" : "true"} />
                    <button className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">
                      {p.status === "active" ? t("products.unpublish") : t("products.publish")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">{t("products.footnote")}</p>
    </div>
  );
}
