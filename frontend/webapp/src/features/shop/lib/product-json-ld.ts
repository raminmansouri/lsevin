import { publicMediaUrl } from "@/lib/seo/media-url";
import { firstSeoPlainText } from "@/lib/seo/plain-text";
import type { ProductDetail } from "@/features/shop/types/domain";
import { shopImageSrc } from "@/features/shop/lib/image";

/**
 * Product structured data (Google: Product snippets / merchant listings). Only
 * what the page shows: the offer mirrors the price block (same amount and
 * currency, rendered for this request), availability follows the stock badge,
 * and ratings come only from the customer reviews listed on the page.
 */
/** Variant option names (any language) -> the schema.org property Google reads. */
const VARIANT_PROPERTIES: [RegExp, string][] = [
  [/colou?r|رنگ|لون|renk|цвет/i, "color"],
  [/size|سایز|اندازه|مقاس|beden|boyut|размер/i, "size"],
  [/material|جنس|مادة|malzeme|материал/i, "material"],
  [/pattern|طرح|نقش|desen|узор/i, "pattern"],
];

export function productJsonLd(product: ProductDetail, productUrl: string, productImages: string[]) {
  const images = [
    ...new Set(productImages.map((url) => publicMediaUrl(shopImageSrc(url))).filter((url): url is string => Boolean(url))),
  ].slice(0, 5);
  const seller = product.offers?.[0]?.sellerName;
  const availability = product.hasStock
    ? "https://schema.org/InStock"
    : product.isPreorder
      ? "https://schema.org/PreOrder"
      : product.allowBackorder
        ? "https://schema.org/BackOrder"
        : "https://schema.org/OutOfStock";
  const reviews = (product.reviews ?? []).filter((review) => review.rating >= 1 && review.rating <= 5);
  const offer = (price: number, compareAt: number | null, currency: string, available: string) => ({
    "@type": "Offer",
    url: productUrl,
    price,
    priceCurrency: currency,
    availability: available,
    ...(seller ? { seller: { "@type": "Organization", name: seller } } : {}),
    // The struck-through "was" price the page shows next to a discount.
    ...(compareAt && compareAt > price
      ? {
          priceSpecification: [
            { "@type": "UnitPriceSpecification", price, priceCurrency: currency },
            { "@type": "UnitPriceSpecification", priceType: "https://schema.org/StrikethroughPrice", price: compareAt, priceCurrency: currency },
          ],
        }
      : {}),
  });
  // Variants (colour, size...) as Google's ProductGroup: one Product per variant
  // with its own SKU, options, price and stock.
  const variants = (product.variants ?? []).filter((v) => !v.priceUnavailable && Number(v.price) > 0);
  const variesBy = new Set<string>();
  const hasVariant = variants.length > 1
    ? variants.map((variant) => {
        const properties: Record<string, string> = {};
        for (const [name, value] of Object.entries(variant.selections ?? {})) {
          const property = VARIANT_PROPERTIES.find(([pattern]) => pattern.test(name))?.[1];
          if (property && value) {
            properties[property] = value;
            variesBy.add(`https://schema.org/${property}`);
          }
        }
        const availableVariant = variant.hasStock
          ? "https://schema.org/InStock"
          : variant.allowBackorder
            ? "https://schema.org/BackOrder"
            : "https://schema.org/OutOfStock";
        return {
          "@type": "Product",
          // Google: one SKU, no whitespace. Some catalog SKUs hold the product
          // name ("Smart Super Wave Medical Pillow"); the variant slug is used then.
          sku: variant.sku && !/\s/.test(variant.sku) ? variant.sku : variant.slug || variant.id,
          inProductGroupWithID: product.id,
          name: variant.title ? `${product.name} - ${variant.title}` : product.name,
          ...properties,
          ...(images[0] ? { image: images[0] } : {}),
          offers: offer(Number(variant.price), variant.compareAtPrice, variant.currency, availableVariant),
        };
      })
    : [];
  return {
    "@type": hasVariant.length ? "ProductGroup" : "Product",
    "@id": `${productUrl}#product`,
    ...(hasVariant.length ? { productGroupID: product.id, ...(variesBy.size ? { variesBy: [...variesBy] } : {}), hasVariant } : {}),
    name: product.name,
    url: productUrl,
    sku: product.id,
    description: firstSeoPlainText([product.shortDescription, product.description], 500) || undefined,
    image: images.map((url) => ({
      "@type": "ImageObject",
      contentUrl: url,
      url,
      ...(seller ? { creditText: seller, creator: { "@type": "Organization", name: seller }, copyrightNotice: seller } : {}),
    })),
    ...(product.brandName ? { brand: { "@type": "Brand", name: product.brandName } } : {}),
    // No `category`: Google's merchant listings read it as its product taxonomy
    // and reported the shop's own category name as an invalid value (Rich
    // Results Test, 2026-11-16). The shop category is in the breadcrumb.
    ...(hasVariant.length || product.priceUnavailable || !(Number(product.price) > 0)
      ? {}
      : { offers: offer(Number(product.price), product.compareAtPrice, product.currency, availability) }),
    // Real customer reviews only, and only the ones the page lists.
    ...(reviews.length && product.reviewCount > 0 && product.rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating.toFixed(1)),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            author: { "@type": "Person", name: review.customerName || "Customer" },
            datePublished: review.createDate?.slice(0, 10),
            ...(review.title ? { name: review.title } : {}),
            ...(review.body ? { reviewBody: firstSeoPlainText([review.body], 500) } : {}),
          })),
        }
      : {}),
  };
}
