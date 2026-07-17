'use client';

import { Search, X } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { shouldShowSearch } from '../../lib/decision-stack';

interface OpenQuestionProps<T> {
  question: string;
  helper?: string | null;
  items: T[];
  total: number;
  hasMore?: boolean;
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
  renderRow: (item: T) => React.ReactNode;
  emptyText: string;
}

export function OpenQuestion<T extends { id: string }>({
  question,
  helper,
  items,
  total,
  hasMore,
  loading,
  search,
  onSearchChange,
  onLoadMore,
  renderRow,
  emptyText,
}: OpenQuestionProps<T>) {
  const tBooking = useTranslations('Booking');
  const searchable = shouldShowSearch({ total, search });
  const searching = search.trim().length > 0;
  const remaining = Math.max(0, total - items.length);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-900">{question}</h2>
        {total > 1 ? (
          <span className="shrink-0 text-xs font-medium text-slate-400">{tBooking('optionCount', { count: total })}</span>
        ) : null}
      </div>
      {helper ? <p className="-mt-1 text-xs leading-5 text-slate-500">{helper}</p> : null}

      {searchable ? (
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            role="searchbox"
            inputMode="search"
            enterKeyHint="search"
            placeholder={tBooking('searchAmong', { count: total })}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white ps-10 pe-10 text-sm outline-none focus:border-[#155e75]"
          />
          {searching ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={tBooking('clearSearch')}
              className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="space-y-2" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-2" role="radiogroup" aria-label={question}>
          {items.map((item) => (
            <React.Fragment key={item.id}>{renderRow(item)}</React.Fragment>
          ))}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {searching ? (
            <>
              <div>{tBooking('noSearchResults', { query: search })}</div>
              <button type="button" onClick={() => onSearchChange('')} className="mt-2 text-xs font-bold text-[#155e75]">
                {tBooking('clearSearch')}
              </button>
            </>
          ) : (
            emptyText
          )}
        </div>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          {tBooking('showMoreCount', { count: remaining })}
        </button>
      ) : null}
    </section>
  );
}
