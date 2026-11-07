import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { ApiReviewDecision } from "@/features/shop-api/components/ApiReviewDecision";
import { listReviewQueue } from "@/features/shop-api/server/admin";

export const dynamic = "force-dynamic";

const FIELD_ORDER = ["name", "shortDescription", "description", "slug", "primaryCategoryId", "categoryIds", "images"] as const;

function preview(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.join("، ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([locale, text]) => `${locale}: ${String(text).slice(0, 300)}`)
      .join(" | ");
  }
  return String(value);
}

/** Seller (API) products and edits waiting for an admin before they reach the storefront. */
export default async function AdminShopApiReviewPage() {
  const t = await getTranslations("ShopAdmin.apiReview");
  const tNav = await getTranslations("ShopAdmin.nav");
  const format = await getFormatter();
  const { products, changes } = await listReviewQueue();
  const date = (value: Date) => format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/admin/shop/api-tokens" className="text-[#083f30]">{tNav("apiTokens")}</Link>
          <Link href="/admin/shop" className="text-[#083f30]">{tNav("backToDashboard")}</Link>
        </div>
      </div>
      <p className="mb-6 max-w-3xl text-sm text-gray-600">{t("intro")}</p>

      <section className="mb-8" data-testid="api-review-products">
        <h2 className="mb-3 text-lg font-bold text-gray-900">{t("newProducts")} ({products.length})</h2>
        {products.length === 0 ? <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">{t("emptyProducts")}</p> : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((product) => (
            <article key={product.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4" data-testid="api-review-product">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {product.image ? <img src={product.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-xl bg-gray-100" />}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-semibold text-gray-900">{product.name}</div>
                <div className="text-xs text-gray-500">
                  {t("seller")}: {product.sellerName} · <span dir="ltr">{product.slug}</span> · {date(product.createDate)}
                </div>
                {product.price ? <div className="text-xs text-gray-700">{t("price")}: {format.number(Number(product.price))} {product.currency}</div> : null}
                {product.shortDescription ? <p className="line-clamp-3 text-sm text-gray-600">{product.shortDescription}</p> : null}
                <ApiReviewDecision kind="product" targetId={product.id} label={product.name} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section data-testid="api-review-changes">
        <h2 className="mb-3 text-lg font-bold text-gray-900">{t("changes")} ({changes.length})</h2>
        {changes.length === 0 ? <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">{t("emptyChanges")}</p> : null}
        <div className="space-y-3">
          {changes.map((change) => (
            <article key={change.id} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4" data-testid="api-review-change">
              <div className="font-semibold text-gray-900">
                <Link href={`/admin/shop/products/${change.productId}`} className="hover:underline">{change.productName}</Link>
              </div>
              <div className="text-xs text-gray-500">
                {t("seller")}: {change.sellerName} · {date(change.createDate)}
              </div>
              <dl className="grid gap-1 text-sm">
                {FIELD_ORDER.filter((field) => field in change.changes).map((field) => (
                  <div key={field} className="grid grid-cols-[9rem,1fr] gap-2">
                    <dt className="text-gray-500">{t(`field.${field}` as never)}</dt>
                    <dd className="break-words text-gray-900">{preview(change.changes[field])}</dd>
                  </div>
                ))}
              </dl>
              <ApiReviewDecision kind="change" targetId={change.id} label={change.productName} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
