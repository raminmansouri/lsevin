import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import type { HomeSection } from "../api/home.repository";
import type { ProductCard as ProductCardModel } from "../types/domain";
import { ProductCard, shopCardLabels } from "./ProductCard";

export async function ProductGrid({
  products,
  locale,
  className = "",
}: {
  products: ProductCardModel[];
  locale: string;
  className?: string;
}) {
  const t = await getTranslations("Shop");
  const labels = shopCardLabels(t);
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${className}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} locale={locale} labels={labels} priority={i < 4} />
      ))}
    </div>
  );
}

function ShortcutRail({ section }: { section: Extract<HomeSection, { type: "shortcut_rail" }> }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-3">
      {section.shortcuts.map((s) => (
        <Link key={s.id} href={s.linkUrl} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${
              s.gradient ?? "from-emerald-500 to-teal-600"
            } text-2xl shadow-sm`}
          >
            {s.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt={s.label} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              (s.icon ?? "🏷️")
            )}
          </span>
          <span className="line-clamp-1 text-center text-[11px] font-medium text-neutral-700">{s.label}</span>
        </Link>
      ))}
    </div>
  );
}

function PromoCards({ section }: { section: Extract<HomeSection, { type: "promo_cards" }> }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 py-1">
      {section.promos.map((p) => (
        <Link
          key={p.id}
          href={p.linkUrl ?? "/n/app/mobile/shop/search"}
          className="relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl p-3 text-white shadow-sm"
        >
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.label} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#083f30] to-[#eacb7f]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="relative">
            {p.badge ? (
              <span className="mb-1 inline-block rounded bg-[#e02e2a] px-1.5 py-0.5 text-[10px] font-bold">{p.badge}</span>
            ) : null}
            <div className="text-sm font-bold leading-tight">{p.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function SectionRail({
  section,
  locale,
}: {
  section: Extract<HomeSection, { type: "product_rail" }>;
  locale: string;
}) {
  const t = await getTranslations("Shop");
  const labels = shopCardLabels(t);
  return (
    <section className="py-2">
      <div className="flex items-center justify-between px-4">
        <div>
          <h2 className="text-[17px] font-extrabold text-neutral-900">{section.title}</h2>
          {section.subtitle ? <p className="text-xs text-neutral-500">{section.subtitle}</p> : null}
        </div>
        {section.viewAllHref ? (
          <Link href={section.viewAllHref} className="text-xs font-semibold text-[#083f30]">
            {t("viewAll")} ›
          </Link>
        ) : null}
      </div>
      <div className="no-scrollbar mt-2 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {section.products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} labels={labels} className="w-[150px] shrink-0" />
        ))}
      </div>
    </section>
  );
}

export async function HomeSectionView({ section, locale }: { section: HomeSection; locale: string }) {
  if (section.type === "shortcut_rail") return <ShortcutRail section={section} />;
  if (section.type === "promo_cards") return <PromoCards section={section} />;
  if (section.type === "product_rail") return <SectionRail section={section} locale={locale} />;
  return null;
}
