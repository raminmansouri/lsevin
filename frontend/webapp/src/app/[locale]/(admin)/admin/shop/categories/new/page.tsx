import Link from "next/link";

import { listAdminCategories } from "@/features/shop/api/admin.repository";
import { CategoryForm } from "@/features/shop/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function AdminNewCategoryPage() {
  const categories = await listAdminCategories();
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/categories" className="text-sm font-medium text-[#083f30]">← Categories</Link>
        <h1 className="text-xl font-bold text-gray-900">New category</h1>
      </div>
      <CategoryForm categories={categories} />
    </div>
  );
}
