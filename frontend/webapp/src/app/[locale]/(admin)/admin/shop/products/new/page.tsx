import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listAdminCategories } from "@/features/shop/api/admin.repository";
import { ProductCreateForm } from "@/features/shop/components/admin/ProductCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const t = await getTranslations("ShopAdmin");
  const categories = await listAdminCategories();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/shop/products" className="text-sm font-medium text-[#083f30]">{t("nav.backToProducts")}</Link>
        <h1 className="text-xl font-bold text-gray-900">{t("productNew.title")}</h1>
      </div>
      <ProductCreateForm categories={categories.map((c: any) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
