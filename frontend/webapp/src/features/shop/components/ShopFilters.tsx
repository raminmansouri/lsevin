"use client";
import { useForm } from "react-hook-form";
import { Search, SlidersHorizontal } from "lucide-react";
export function ShopFilters({ initialQuery, onApply }: { initialQuery: { q: string; sort: string; minPrice: number; maxPrice: number; minRating: number; inStockOnly: boolean; }; onApply: (params: URLSearchParams) => void; }) {
  const form = useForm({ defaultValues: initialQuery });
  return (
    <form className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm" onSubmit={form.handleSubmit((values) => { const params = new URLSearchParams(); if (values.q) params.set("q", values.q as string); if (values.sort && values.sort !== "popularity") params.set("sort", String(values.sort)); if ((values.minPrice as number) > 0) params.set("minPrice", String(values.minPrice)); if ((values.maxPrice as number) > 0) params.set("maxPrice", String(values.maxPrice)); if ((values.minRating as number) > 0) params.set("minRating", String(values.minRating)); if (values.inStockOnly) params.set("inStockOnly", "1"); onApply(params); })}>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3"><Search size={18} className="text-gray-400" /><input {...form.register("q")} className="w-full bg-transparent text-sm outline-none" placeholder="Search products..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <select {...form.register("sort")} className="rounded-xl border border-gray-200 px-3 py-3 text-sm"><option value="popularity">Popularity</option><option value="newest">Newest</option><option value="price_asc">Price low to high</option><option value="price_desc">Price high to low</option><option value="rating">Rating</option></select>
        <select {...form.register("minRating", { valueAsNumber: true })} className="rounded-xl border border-gray-200 px-3 py-3 text-sm"><option value={0}>Any rating</option><option value={3}>3.0+</option><option value={4}>4.0+</option><option value={4.5}>4.5+</option></select>
        <input {...form.register("minPrice", { valueAsNumber: true })} type="number" min={0} className="rounded-xl border border-gray-200 px-3 py-3 text-sm" placeholder="Min price" />
        <input {...form.register("maxPrice", { valueAsNumber: true })} type="number" min={0} className="rounded-xl border border-gray-200 px-3 py-3 text-sm" placeholder="Max price" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...form.register("inStockOnly")} />In stock only</label>
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white"><SlidersHorizontal size={16} />Apply filters</button>
    </form>
  );
}
