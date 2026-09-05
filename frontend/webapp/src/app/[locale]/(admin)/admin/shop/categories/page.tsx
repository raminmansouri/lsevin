import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listCategoriesAdminFull } from "@/features/shop/api/admin.repository";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const t = await getTranslations("ShopAdmin");
  const categories = await listCategoriesAdminFull();
  type Category = (typeof categories)[number];
  const byParent = new Map<string, Category[]>();
  for (const c of categories) {
    const key = c.parent_id ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }

  function Row({ c, depth }: { c: Category; depth: number }) {
    return (
      <>
        <tr>
          <td className="px-4 py-3" style={{ paddingInlineStart: `${16 + depth * 20}px` }}>
            {c.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image_url} alt="" className="me-2 inline-block h-6 w-6 rounded object-cover align-middle" />
            ) : null}
            <Link href={`/admin/shop/categories/${c.id}`} className="font-medium text-[#083f30] hover:underline">{c.name}</Link>
          </td>
          <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.slug}</td>
          <td className="px-4 py-3">{c.product_count}</td>
          <td className="px-4 py-3">{c.display_order}</td>
          <td className="px-4 py-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {c.is_active ? t("common.activeShort") : t("common.inactiveShort")}
            </span>
          </td>
        </tr>
        {(byParent.get(c.id) ?? []).map((child) => <Row key={child.id} c={child} depth={depth + 1} />)}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("categories.title")}</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/shop/categories/new" className="rounded-lg bg-[#083f30] px-3 py-1.5 text-sm font-semibold text-white">{t("categories.new")}</Link>
          <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("categories.colCategory")}</th>
              <th className="px-4 py-3">{t("categories.colSlug")}</th>
              <th className="px-4 py-3">{t("categories.colProducts")}</th>
              <th className="px-4 py-3">{t("categories.colOrder")}</th>
              <th className="px-4 py-3">{t("categories.colStatus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(byParent.get("root") ?? []).map((c) => <Row key={c.id} c={c} depth={0} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
