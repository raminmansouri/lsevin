"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ShopFacets } from "../../api/catalog.repository";
import type { ShopFilters } from "../../lib/catalog-filters";

type ListKey = "brands" | "sellers" | "attrs";

function Section({ title, badge, defaultOpen = true, children }: { title: string; badge?: number; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group border-b border-[#eacb7f]/35 py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[15px] font-bold text-[#0e1a16] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {badge ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#083f30] px-1.5 text-[11px] font-bold text-[#eacb7f]">{badge}</span>
          ) : null}
        </span>
        <ChevronDown className="size-4 text-[#8c6b2c] transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Box({ on }: { on: boolean }) {
  return (
    <span
      className={`grid size-[18px] shrink-0 place-items-center rounded-[6px] border transition ${
        on ? "border-[#083f30] bg-[#083f30] text-[#eacb7f]" : "border-[#d9cfb8] bg-white"
      }`}
    >
      {on ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : null}
    </span>
  );
}

function OptionList({
  options,
  selected,
  onToggle,
  locale,
  searchLabel,
}: {
  options: Array<{ value: string; label: string; count: number }>;
  selected: string[];
  onToggle: (value: string) => void;
  locale: string;
  searchLabel: string;
}) {
  const t = useTranslations("Shop.filter");
  const number = new Intl.NumberFormat(locale);
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const sorted = useMemo(
    () => [...options].sort((a, b) => Number(selected.includes(b.value)) - Number(selected.includes(a.value))),
    [options, selected],
  );
  const filtered = query ? sorted.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : sorted;
  const shown = all || query ? filtered : filtered.slice(0, 6);

  return (
    <div className="space-y-1">
      {options.length > 8 ? (
        <label className="mb-2 flex h-10 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#eadfc6] focus-within:ring-[#c9a55a]">
          <Search className="size-4 shrink-0 text-[#a3967c]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b5a98f]"
          />
        </label>
      ) : null}
      {shown.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={!on && o.count === 0}
            onClick={() => onToggle(o.value)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-start text-sm text-[#2b2a25] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Box on={on} />
            <span className={`min-w-0 flex-1 truncate ${on ? "font-bold text-[#083f30]" : ""}`}>{o.label}</span>
            <span className="text-xs tabular-nums text-[#a3967c]">{number.format(o.count)}</span>
          </button>
        );
      })}
      {!filtered.length ? <p className="px-2 py-2 text-xs text-[#a3967c]">{t("noOptions")}</p> : null}
      {!query && filtered.length > 6 ? (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 px-2 text-xs font-bold text-[#8c6b2c] hover:text-[#083f30]">
          {all ? t("showLess") : t("showAll", { count: filtered.length })}
        </button>
      ) : null}
    </div>
  );
}

function PriceRange({
  facets,
  filters,
  locale,
  onCommit,
}: {
  facets: ShopFacets["price"];
  filters: ShopFilters;
  locale: string;
  onCommit: (minPrice: number, maxPrice: number) => void;
}) {
  const t = useTranslations("Shop.filter");
  const { min, max } = facets;
  const [lo, setLo] = useState(filters.minPrice || min);
  const [hi, setHi] = useState(filters.maxPrice || max);
  useEffect(() => {
    setLo(filters.minPrice || min);
    setHi(filters.maxPrice || max);
  }, [filters.minPrice, filters.maxPrice, min, max]);

  if (max <= min) return <p className="text-xs text-[#a3967c]">{t("noOptions")}</p>;

  const number = new Intl.NumberFormat(locale);
  const span = max - min;
  const pct = (v: number) => ((Math.min(Math.max(v, min), max) - min) / span) * 100;
  const step = Math.max(1, Math.round(span / 200));
  const commit = () => onCommit(lo <= min ? 0 : Math.round(lo), hi >= max ? 0 : Math.round(hi));
  const thumb =
    "pointer-events-none absolute inset-0 h-7 w-full appearance-none bg-transparent outline-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#c9a55a] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(6,42,32,0.25)] " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-[18px] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#c9a55a] [&::-moz-range-thumb]:bg-white";

  return (
    <div dir="ltr">
      <div className="relative mt-1 h-7">
        <div className="absolute inset-x-[11px] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e8dfcc]" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#c9a55a] to-[#eacb7f]"
          style={{ left: `calc(11px + (100% - 22px) * ${pct(lo) / 100})`, right: `calc(11px + (100% - 22px) * ${(100 - pct(hi)) / 100})` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - step))}
          onPointerUp={commit}
          onKeyUp={commit}
          onTouchEnd={commit}
          aria-label={t("from")}
          className={thumb}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + step))}
          onPointerUp={commit}
          onKeyUp={commit}
          onTouchEnd={commit}
          aria-label={t("to")}
          className={thumb}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2" dir={locale.startsWith("fa") || locale.startsWith("ar") || locale.startsWith("ku") ? "rtl" : "ltr"}>
        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfc6]">
          <span className="block text-[10px] font-bold text-[#a3967c]">{t("from")}</span>
          <span className="block truncate text-sm font-bold tabular-nums text-[#083f30]">{number.format(Math.round(lo))}</span>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfc6]">
          <span className="block text-[10px] font-bold text-[#a3967c]">{t("to")}</span>
          <span className="block truncate text-sm font-bold tabular-nums text-[#083f30]">{number.format(Math.round(hi))}</span>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick, icon }: { label: string; on: boolean; onClick: () => void; icon?: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex w-full items-center justify-between gap-3 py-1.5 text-sm text-[#2b2a25]">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-[#083f30]" : "bg-[#e3dac6]"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full shadow transition-all duration-300 ${on ? "start-[22px] bg-[#eacb7f]" : "start-0.5 bg-white"}`} />
      </span>
    </button>
  );
}

function AttributeFacet({
  attribute,
  selected,
  onToggle,
  locale,
}: {
  attribute: ShopFacets["attributes"][number];
  selected: string[];
  onToggle: (value: string) => void;
  locale: string;
}) {
  const t = useTranslations("Shop.filter");
  const swatches = attribute.values.every((v) => v.colorHex);
  const short = attribute.values.every((v) => v.label.length <= 5);

  if (swatches) {
    return (
      <div className="flex flex-wrap gap-2.5">
        {attribute.values.map((v) => {
          const on = selected.includes(v.id);
          return (
            <button
              key={v.id}
              type="button"
              title={v.label}
              aria-label={v.label}
              aria-pressed={on}
              disabled={!on && v.count === 0}
              onClick={() => onToggle(v.id)}
              style={{ background: v.colorHex ?? undefined }}
              className={`size-9 rounded-full ring-1 ring-black/10 transition disabled:opacity-30 ${on ? "scale-110 ring-2 ring-[#c9a55a] ring-offset-2 ring-offset-[#fbf7ee]" : "hover:scale-105"}`}
            />
          );
        })}
      </div>
    );
  }

  if (short) {
    return (
      <div className="flex flex-wrap gap-2">
        {attribute.values.map((v) => {
          const on = selected.includes(v.id);
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={on}
              disabled={!on && v.count === 0}
              onClick={() => onToggle(v.id)}
              className={`min-w-11 rounded-xl px-3 py-2 text-sm font-bold transition disabled:opacity-30 ${
                on ? "bg-[#083f30] text-[#eacb7f] shadow-[0_6px_16px_-8px_rgba(8,63,48,0.8)]" : "bg-white text-[#2b2a25] ring-1 ring-[#eadfc6] hover:ring-[#c9a55a]"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <OptionList
      options={attribute.values.map((v) => ({ value: v.id, label: v.label, count: v.count }))}
      selected={selected}
      onToggle={onToggle}
      locale={locale}
      searchLabel={t("searchIn", { name: attribute.name })}
    />
  );
}

export function ShopFilterPanel({
  facets,
  filters,
  locale,
  showCategory,
  onPatch,
  onToggle,
}: {
  facets: ShopFacets;
  filters: ShopFilters;
  locale: string;
  showCategory: boolean;
  onPatch: (patch: Partial<ShopFilters>) => void;
  onToggle: (key: ListKey, value: string) => void;
}) {
  const t = useTranslations("Shop.filter");
  const tShop = useTranslations("Shop");
  const number = new Intl.NumberFormat(locale);

  const topCategories = facets.categories.filter((c) => !c.parentSlug || !facets.categories.some((x) => x.slug === c.parentSlug));
  const childrenOf = (slug: string) => facets.categories.filter((c) => c.parentSlug === slug);
  const categoryRow = (c: ShopFacets["categories"][number], nested = false) => {
    const on = filters.category === c.slug;
    return (
      <button
        key={c.slug}
        type="button"
        aria-pressed={on}
        onClick={() => onPatch({ category: on ? undefined : c.slug })}
        className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start text-sm transition hover:bg-white ${nested ? "ps-7" : ""} ${on ? "font-bold text-[#083f30]" : "text-[#2b2a25]"}`}
      >
        <span className={`size-2 shrink-0 rounded-full transition ${on ? "bg-[#c9a55a] shadow-[0_0_0_4px_rgba(201,165,90,0.2)]" : "bg-[#e3dac6]"}`} />
        <span className="min-w-0 flex-1 truncate">{c.name}</span>
        <span className="text-xs tabular-nums text-[#a3967c]">{number.format(c.count)}</span>
      </button>
    );
  };

  return (
    <div>
      {showCategory && facets.categories.length ? (
        <Section title={t("category")} badge={filters.category ? 1 : undefined}>
          <div className="space-y-0.5">
            {topCategories.map((c) => (
              <div key={c.slug}>
                {categoryRow(c)}
                {childrenOf(c.slug).map((child) => categoryRow(child, true))}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title={t("price")} badge={filters.minPrice || filters.maxPrice ? 1 : undefined}>
        <PriceRange facets={facets.price} filters={filters} locale={locale} onCommit={(minPrice, maxPrice) => onPatch({ minPrice, maxPrice })} />
      </Section>

      <Section title={t("quick")}>
        <Toggle label={tShop("inStockOnly")} on={filters.inStockOnly} onClick={() => onPatch({ inStockOnly: !filters.inStockOnly })} />
        <Toggle label={tShop("onSale")} on={filters.discountedOnly} onClick={() => onPatch({ discountedOnly: !filters.discountedOnly })} />
        <Toggle
          label={tShop("rating4plus")}
          icon={<Star className="size-3.5 fill-[#c9a55a] text-[#c9a55a]" aria-hidden="true" />}
          on={filters.minRating >= 4}
          onClick={() => onPatch({ minRating: filters.minRating >= 4 ? 0 : 4 })}
        />
      </Section>

      {facets.brands.length ? (
        <Section title={t("brand")} badge={filters.brands.length || undefined}>
          <OptionList
            options={facets.brands.map((b) => ({ value: b.slug, label: b.name, count: b.count }))}
            selected={filters.brands}
            onToggle={(v) => onToggle("brands", v)}
            locale={locale}
            searchLabel={t("searchIn", { name: t("brand") })}
          />
        </Section>
      ) : null}

      {facets.sellers.length > 1 ? (
        <Section title={t("seller")} badge={filters.sellers.length || undefined} defaultOpen={false}>
          <OptionList
            options={facets.sellers.map((s) => ({ value: s.slug, label: s.name, count: s.count }))}
            selected={filters.sellers}
            onToggle={(v) => onToggle("sellers", v)}
            locale={locale}
            searchLabel={t("searchIn", { name: t("seller") })}
          />
        </Section>
      ) : null}

      {facets.attributes.map((attribute) => {
        const picked = attribute.values.filter((v) => filters.attrs.includes(v.id)).length;
        return (
          <Section key={attribute.id} title={attribute.name} badge={picked || undefined} defaultOpen={attribute.values.length <= 12}>
            <AttributeFacet attribute={attribute} selected={filters.attrs} onToggle={(v) => onToggle("attrs", v)} locale={locale} />
          </Section>
        );
      })}
    </div>
  );
}