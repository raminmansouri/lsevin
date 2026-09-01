import Link from "next/link";

import { listAdminProducts } from "@/features/shop/api/admin.repository";
import { setProductPublishedForm } from "@/features/shop/actions/admin.actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rows = await listAdminProducts(q);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/shop/products/new" className="rounded-lg bg-[#083f30] px-3 py-1.5 text-sm font-semibold text-white">+ New product</Link>
          <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
        </div>
      </div>

      <form method="get" className="mb-4">
        <input name="q" defaultValue={q ?? ""} placeholder="Search products…" className="h-9 w-64 rounded-lg border border-gray-200 px-3 text-sm" />
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Source price</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Badges</th>
              <th className="px-4 py-3">Status</th>
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
                  {[p.is_featured && "featured", p.is_best_seller && "best-seller", p.is_new_arrival && "new"].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={setProductPublishedForm}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="published" value={p.status === "active" ? "false" : "true"} />
                    <button className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">
                      {p.status === "active" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Variant editor is the next admin increment; publish/unpublish never deletes order history (SHP-ADM-008).
      </p>
    </div>
  );
}
