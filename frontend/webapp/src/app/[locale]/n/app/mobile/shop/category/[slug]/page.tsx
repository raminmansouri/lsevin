import { searchProducts } from "@/features/shop/api/catalog.repository";
import { ProductCard } from "@/features/shop/components/ProductCard";
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>; }) {
  const { locale, slug } = await params;
  const query = await searchParams;
  const data = await searchProducts({ q: String(query.q ?? ""), category: slug, sort: (query.sort as any) ?? "popularity", minPrice: Number(query.minPrice ?? 0), maxPrice: Number(query.maxPrice ?? 0), minRating: Number(query.minRating ?? 0), inStockOnly: ["1", "true", "yes"].includes(String(query.inStockOnly ?? "")), featuredOnly: false, page: Number(query.page ?? 1), pageSize: 12 }, locale);
  return (
    <div className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="mb-4"><h1 className="text-2xl font-bold text-gray-900 capitalize">{slug.replace(/-/g, " ")}</h1><p className="mt-1 text-sm text-gray-600">{data.total} products found</p></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{data.items.map((product) => <a key={product.id} href={`/n/app/mobile/shop/product/${product.slug}`}><ProductCard product={product} /></a>)}</div>
    </div>
  );
}
