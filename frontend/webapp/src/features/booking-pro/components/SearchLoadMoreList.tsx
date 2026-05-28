'use client';
import { Search } from 'lucide-react';
import React from 'react';
import { useTranslations } from "next-intl";
interface SearchLoadMoreListProps<T> {
    title: string;
    search: string;
    onSearchChange: (value: string) => void;
    items: T[];
    hasMore?: boolean;
    loading?: boolean;
    emptyText: string;
    renderItem: (item: T) => React.ReactNode;
    onLoadMore: () => void;
}
export function SearchLoadMoreList<T>({ title, search, onSearchChange, items, hasMore, loading, emptyText, renderItem, onLoadMore }: SearchLoadMoreListProps<T>) {
    const tBooking = useTranslations("Booking");
    return (<section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={tBooking("searchList", { title })} className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-[#155e75]"/>
      </div>
      <div className="grid gap-4">
        {items.map((item, idx) => <React.Fragment key={(item as any)?.id ?? idx}>{renderItem(item)}</React.Fragment>)}
      </div>
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">{tBooking("loadingBooking")}</div> : null}
      {!loading && items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{emptyText}</div> : null}
      {hasMore ? (<button type="button" onClick={onLoadMore} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-[#083f30]/30 hover:text-[#083f30]">{tBooking("load3More")}</button>) : null}
    </section>);
}
