import { getProductBySlug } from "@/features/shop/api/catalog.repository";
import { ProductCard } from "@/features/shop/components/ProductCard";
export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, locale);
  if (!product) return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600">Product not found.</div>;
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="grid gap-8 px-5 py-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white"><div className="aspect-square bg-gray-50">{product.gallery[0] ? <img src={product.gallery[0].url} alt={product.name} className="h-full w-full object-cover" /> : null}</div></div>
          <div className="grid grid-cols-4 gap-3">{product.gallery.slice(0, 4).map((media) => <div key={media.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white"><img src={media.url} alt={media.alt || product.name} className="aspect-square h-full w-full object-cover" /></div>)}</div>
        </section>
        <section className="space-y-5">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{product.brandName ?? product.categoryName ?? "Shop"}</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">{product.shortDescription}</p>
            <div className="mt-4 flex items-center gap-3"><span className="text-3xl font-bold text-[#083f30]">{product.currency} {product.minPrice.toFixed(2)}</span>{product.compareAtPrice ? <span className="text-sm text-gray-400 line-through">{product.currency} {product.compareAtPrice.toFixed(2)}</span> : null}</div>
            <div className="mt-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.hasStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{product.hasStock ? "In stock" : "Out of stock"}</span></div>
            <div className="mt-6 flex gap-3"><button className="flex-1 rounded-2xl bg-[#083f30] px-5 py-4 font-semibold text-white">Add to cart</button><button className="rounded-2xl border border-gray-200 px-5 py-4 font-semibold text-gray-900">Wishlist</button></div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-gray-900">Description</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">{product.description}</p></div>
        </section>
      </div>
      <section className="px-5 py-4"><h2 className="mb-4 text-xl font-bold text-gray-900">Related products</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{product.relatedProducts.map((item) => <a key={item.id} href={`/n/app/mobile/shop/product/${item.slug}`}><ProductCard product={item} /></a>)}</div></section>
    </div>
  );
}
