import { Suspense } from "react";
import { listAdminProducts } from "@/features/shop/api/admin.repository";
import { AdminDataTable } from "@/features/shop/components/AdminDataTable";

async function AdminProductsTable() {
  const rows = await listAdminProducts();

  return (
    <AdminDataTable
  rows={rows}
  columns={[
    { key: "name", label: "Product" },
    { key: "slug", label: "Slug" },
    { key: "status", label: "Status" },
    {
      key: "base_price",
      label: "Price",
      format: "money",
      currencyKey: "currency",
    },
    { key: "published_at", label: "Published", format: "date" },
  ]}
/>
  );
}

function AdminProductsTableSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 px-4 py-4">
            <div className="h-4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <a
          href="/admin/shop/products/new"
          className="rounded-xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white"
        >
          New product
        </a>
      </div>

      <Suspense fallback={<AdminProductsTableSkeleton />}>
        <AdminProductsTable />
      </Suspense>
    </div>
  );
}