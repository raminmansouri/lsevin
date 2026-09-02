import "server-only";

import type { ProductCard, ShopCategory } from "../types/domain";
import { getShopContext, normalizeLocale } from "../lib/context";
import { resolveDisplayCurrency } from "../lib/pricing";
import { sql } from "../lib/db";
import { searchProducts } from "./catalog.repository";
import { getShopCategoriesCached } from "./catalog.repository.cached";

/**
 * Data-driven Shop home composition (SHP-DB-003, SHP-UX-013, SHP-ADM-018).
 * Sections, their order and how each product rail fills itself all come from
 * `shop.home_sections` — no campaign is hardcoded in the page.
 */

export type HomeShortcut = { id: string; label: string; slug: string | null; imageUrl: string | null; icon: string | null; gradient: string | null; linkUrl: string };
export type HomePromo = { id: string; label: string; imageUrl: string | null; linkUrl: string | null; badge: string | null };

export type HomeSection =
  | { key: string; type: "shortcut_rail"; title: string; subtitle: string; shortcuts: HomeShortcut[] }
  | { key: string; type: "promo_cards"; title: string; subtitle: string; promos: HomePromo[] }
  | { key: string; type: "product_rail"; title: string; subtitle: string; querySource: string; products: ProductCard[]; viewAllHref: string | null }
  | { key: string; type: "category_rail"; title: string; subtitle: string; categories: ShopCategory[] };

export type ShopHome = {
  currency: string;
  pricingMode: "market_default" | "market_default_with_selector";
  selectableCurrencies: Array<{ code: string; symbol: string; name: string }>;
  categories: ShopCategory[];
  sections: HomeSection[];
};

type SectionRow = {
  id: string;
  key: string;
  section_type: string;
  title: string;
  subtitle: string;
  query_source: string;
  query_config: Record<string, unknown>;
};

const RAIL_LIMIT = 10;

export async function getShopHome(): Promise<ShopHome> {
  const ctx = await getShopContext();
  const lang = normalizeLocale(ctx.locale);
  const { currency, mode, selectable } = await resolveDisplayCurrency(ctx);

  const [categories, sectionRows] = await Promise.all([
    getShopCategoriesCached(lang),
    sql<SectionRow[]>`
      select
        s.id::text as id, s.key, s.section_type,
        common.get_translation_t(s.title_translations, ${lang}, 'en') as title,
        common.get_translation_t(s.subtitle_translations, ${lang}, 'en') as subtitle,
        s.query_source, s.query_config
      from shop.home_sections s
      where s.is_active = true
      order by s.display_order asc
    `,
  ]);

  const sections: HomeSection[] = [];

  for (const row of sectionRows) {
    if (row.section_type === "shortcut_rail") {
      const items = await sql<any[]>`
        select i.id::text as id,
          common.get_translation_t(i.label_translations, ${lang}, 'en') as label,
          c.slug, coalesce(i.image_url, c.image_url) as "imageUrl", c.icon, c.gradient, i.link_url as "linkUrl"
        from shop.home_section_items i
        left join shop.categories c on c.id = i.category_id
        where i.section_id = ${row.id}::uuid and i.is_active = true
        order by i.display_order asc
      `;
      sections.push({
        key: row.key,
        type: "shortcut_rail",
        title: row.title ?? "",
        subtitle: row.subtitle ?? "",
        shortcuts: items.map((it) => ({
          id: it.id,
          label: it.label,
          slug: it.slug ?? null,
          imageUrl: it.imageUrl ?? null,
          icon: it.icon ?? null,
          gradient: it.gradient ?? null,
          linkUrl: it.linkUrl || (it.slug ? `/n/app/mobile/shop/category/${it.slug}` : "/n/app/mobile/shop/search"),
        })),
      });
    } else if (row.section_type === "promo_cards") {
      const items = await sql<any[]>`
        select i.id::text as id,
          common.get_translation_t(i.label_translations, ${lang}, 'en') as label,
          i.image_url as "imageUrl", i.link_url as "linkUrl",
          common.get_translation_t(i.badge_translations, ${lang}, 'en') as badge
        from shop.home_section_items i
        where i.section_id = ${row.id}::uuid and i.is_active = true
        order by i.display_order asc
      `;
      sections.push({
        key: row.key,
        type: "promo_cards",
        title: row.title ?? "",
        subtitle: row.subtitle ?? "",
        promos: items.map((it) => ({ id: it.id, label: it.label, imageUrl: it.imageUrl, linkUrl: it.linkUrl, badge: it.badge || null })),
      });
    } else if (row.section_type === "category_rail") {
      sections.push({ key: row.key, type: "category_rail", title: row.title ?? "", subtitle: row.subtitle ?? "", categories });
    } else {
      // product_rail / service_related_rail
      const cfg = row.query_config || {};
      const filters: Record<string, unknown> = { page: 1, pageSize: RAIL_LIMIT };
      let viewAllHref: string | null = "/n/app/mobile/shop/search";
      switch (row.query_source) {
        case "featured":
          filters.featuredOnly = true;
          filters.sort = "popularity";
          viewAllHref = "/n/app/mobile/shop/search?featuredOnly=1";
          break;
        case "best_seller":
          filters.sort = "popularity";
          viewAllHref = "/n/app/mobile/shop/search?sort=popularity";
          break;
        case "new_arrival":
          filters.sort = "newest";
          viewAllHref = "/n/app/mobile/shop/search?sort=newest";
          break;
        case "discounted":
          filters.sort = "popularity";
          break;
        case "category":
          if (cfg.slug) {
            filters.category = String(cfg.slug);
            viewAllHref = `/n/app/mobile/shop/category/${cfg.slug}`;
          }
          break;
        default:
          filters.sort = "popularity";
      }
      let { items } = await searchProducts(filters, { locale: lang, displayCurrency: currency });
      if (row.query_source === "discounted") items = items.filter((p) => p.hasDiscount);
      if (items.length) {
        sections.push({
          key: row.key,
          type: "product_rail",
          title: row.title ?? "",
          subtitle: row.subtitle ?? "",
          querySource: row.query_source,
          products: items.slice(0, RAIL_LIMIT),
          viewAllHref,
        });
      }
    }
  }

  return {
    currency,
    pricingMode: mode,
    selectableCurrencies: selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name })),
    categories,
    sections,
  };
}
