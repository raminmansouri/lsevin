import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listAdminProductsPage } from "@/features/shop/api/admin.repository";
import { ShopPagination } from "@/features/shop/components/ShopPagination";
import { setProductPublishedForm } from "@/features/shop/actions/admin.actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const t = await getTranslations("ShopAdmin");
  const { locale } = await params;
  const { q, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const { rows, total } = await listAdminProductsPage(q, page, PAGE_SIZE);
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/admin/shop/products?${s}` : "/admin/shop/products";
  };

  const productStatus = (v: string) => (t.has(`enum.productStatus.${v}` as never) ? t(`enum.productStatus.${v}` as never) : v);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("products.title")}
          <span className="ms-2 text-base font-medium text-gray-400">({new Intl.NumberFormat(locale).format(total)})</span>
        </h1>
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
                  <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/shop/products/${p.id}`} className="rounded bg-[#083f30] px-3 py-1 text-xs font-semibold text-white">
                    {t("products.edit")}
                  </Link>
                  <form action={setProductPublishedForm}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="published" value={p.status === "active" ? "false" : "true"} />
                    <button className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">
                      {p.status === "active" ? t("products.unpublish") : t("products.publish")}
                    </button>
                  </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <ShopPagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} locale={locale} hrefFor={pageHref} />
      </div>
      <p className="mt-3 text-xs text-gray-400">{t("products.footnote")}</p>
    </div>
  );
}
