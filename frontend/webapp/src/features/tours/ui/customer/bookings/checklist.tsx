"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { removeChecklistItemAction, setChecklistItemAction } from "../../../server/actions/customer";
import type { ChecklistItem } from "../../../server/actions/customer/state";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { formatNumber } from "../../shared/format";

/** Packing checklist with progress, persisted per booking in tour.checklist_items (C-058). */
export function Checklist({ bookingId, initial }: { bookingId: string; initial: ChecklistItem[] }) {
  const t = useTranslations("TourApp.voucher.checklist");
  const locale = useLocale();
  const [items, setItems] = useState(initial);
  const [persisted, setPersisted] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<ToursActionError | null>(null);
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  async function save(item: ChecklistItem, index: number) {
    const res = await setChecklistItemAction(bookingId, { key: item.key, label: item.label, done: item.done, sortOrder: index }).catch(() => null);
    if (!res?.ok) setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
    else setError(null);
    return Boolean(res?.ok);
  }

  /** The operator's suggested items are stored on the first change so the whole list persists. */
  async function persist(next: ChecklistItem[], changed: number[]) {
    const indexes = persisted ? changed : next.map((_, i) => i);
    const results = await Promise.all(indexes.map((i) => save(next[i], i)));
    if (results.every(Boolean)) setPersisted(true);
    return results.every(Boolean);
  }

  async function toggle(index: number) {
    const before = items;
    const next = items.map((it, i) => (i === index ? { ...it, done: !it.done } : it));
    setItems(next);
    if (!(await persist(next, [index]))) setItems(before);
  }

  async function add() {
    const text = label.trim();
    if (!text) return;
    const before = items;
    const next = [...items, { key: `u-${Date.now().toString(36)}`, label: text.slice(0, 120), done: false }];
    setItems(next);
    setLabel("");
    if (!(await persist(next, [next.length - 1]))) setItems(before);
  }

  async function remove(index: number) {
    const item = items[index];
    const before = items;
    setItems(items.filter((_, i) => i !== index));
    const res = await removeChecklistItemAction(bookingId, item.key).catch(() => null);
    if (!res?.ok) {
      setItems(before);
      setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="checklist" aria-labelledby="checklist-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checklist-title" className="text-sm font-bold text-slate-900">
          {t("title")}
        </h2>
        <span className="text-xs text-slate-600" aria-live="polite" data-testid="checklist-progress">
          {t("progress", { done: formatNumber(done, locale), total: formatNumber(items.length, locale) })}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t("title")}>
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {items.length === 0 ? <p className="mt-2 text-sm text-slate-500">{t("empty")}</p> : null}
      <ul className="mt-2 space-y-1">
        {items.map((it, i) => (
          <li key={it.key} className="flex items-center justify-between gap-2">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={it.done} onChange={() => void toggle(i)} className="size-5 accent-emerald-700" />
              <span className={it.done ? "text-slate-400 line-through" : "text-slate-800"} dir="auto">
                {it.label}
              </span>
              {it.key.startsWith("op-") ? <span className="text-[10px] text-slate-400">{t("fromOperator")}</span> : null}
            </label>
            <button type="button" onClick={() => void remove(i)} aria-label={t("remove", { label: it.label })} className="flex size-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <label htmlFor={`checklist-add-${bookingId}`} className="sr-only">
          {t("addLabel")}
        </label>
        <input id={`checklist-add-${bookingId}`} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm" placeholder={t("addLabel")} />
        <button type="submit" className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white" aria-label={t("add")}>
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("add")}</span>
        </button>
      </form>
      <ToursErrorAlert error={error} className="mt-2" />
    </section>
  );
}
