import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getCompareView } from "@/features/shop/api/compare.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { formatShopMoney } from "@/features/shop/components/money";
import { shopImageSrc } from "@/features/shop/lib/image";

export const dynamic = "force-dynamic";

export default async function ShopComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const [cart, { products }] = await Promise.all([getCartView(), getCompareView()]);

  const attrNames = Array.from(new Set(products.flatMap((p) => p.attributes.map((a) => a.name))));

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader cartCount={cart.itemCount} back="/n/app/mobile/shop" />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("compareTitle")}</h1>

      {!products.length ? (
        <div className="m-4 rounded-2xl bg-white p-10 text-center">
          <div className="text-4xl">⚖️</div>
          <p className="mt-3 text-sm font-semibold text-neutral-700">{t("compareEmpty")}</p>
          <Link href="/n/app/mobile/shop" className="mt-3 inline-block text-xs font-semibold text-[#083f30]">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto p-4 pb-24">
          <table className="w-full min-w-[520px] border-separate border-spacing-2">
            <thead>
              <tr>
                <th />
                {products.map((p) => (
                  <th key={p.id} className="w-40 align-top">
                    <Link href={`/n/app/mobile/shop/product/${p.slug}`} className="block rounded-xl bg-white p-2 ring-1 ring-black/[0.04]">
                      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={shopImageSrc(p.imageUrl)} alt={p.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] font-medium text-neutral-800">{p.name}</p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <Row label={t("grandTotal")} cells={products.map((p) => (p.priceUnavailable ? t("priceUnavailable") : formatShopMoney(p.price, p.currency, locale)))} strong />
              <Row label="★" cells={products.map((p) => (p.rating > 0 ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "—"))} />
              <Row label={t("sold", { count: "" }).replace("{count}", "").trim() || "Sold"} cells={products.map((p) => String(p.soldCount || 0))} />
              <Row label="Brand" cells={products.map((p) => p.brandName ?? "—")} />
              <Row label={t("inStock")} cells={products.map((p) => (p.hasStock ? "✓" : "—"))} />
              {attrNames.map((name) => (
                <Row
                  key={name}
                  label={name}
                  cells={products.map((p) => p.attributes.find((a) => a.name === name)?.value ?? "—")}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, cells, strong }: { label: string; cells: string[]; strong?: boolean }) {
  return (
    <tr>
      <td className="whitespace-nowrap pe-2 text-xs font-semibold text-neutral-500">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className={`rounded-lg bg-white p-2 text-center ring-1 ring-black/[0.03] ${strong ? "font-extrabold text-[#e02e2a]" : "text-neutral-700"}`}>
          {c}
        </td>
      ))}
    </tr>
  );
}
