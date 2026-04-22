import { getShopHomeData } from "@/features/shop/api/catalog.repository";
import { ProductCard } from "@/features/shop/components/ProductCard";

export default async function ShopHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getShopHomeData(locale);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <section className="border-b border-gray-100 bg-white px-5 pb-6 pt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#083f30]">Shop</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Premium products for care, wellness, and lifestyle</h1>
        <p className="mt-2 text-sm text-gray-600">Discover pharmacy, beauty, wellness, fitness, and curated essentials.</p>
      </section>

      <section className="px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Browse categories</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.categories.slice(0, 8).map((category) => (
            <a key={category.id} href={`/n/app/mobile/shop/category/${category.slug}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-[#083f30] via-[#0a5a44] to-[#eacb7f] p-4 text-white shadow-sm">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex h-full flex-col justify-end">
                <h3 className="font-bold">{category.name}</h3>
                <p className="text-xs text-white/85">{category.productCount} products</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {[
        ["Featured products", data.featured],
        ["Best sellers", data.bestSellers],
        ["Newest arrivals", data.newest],
        ["Discounted products", data.discounted],
      ].map(([title, products]) => (
        <section key={String(title)} className="px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{String(title)}</h2>
            <a href="/n/app/mobile/shop/search" className="text-sm font-semibold text-[#083f30]">View all</a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(products as any[]).slice(0, 8).map((product) => (
              <a key={product.id} href={`/n/app/mobile/shop/product/${product.slug}`}>
                <ProductCard product={product} />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
