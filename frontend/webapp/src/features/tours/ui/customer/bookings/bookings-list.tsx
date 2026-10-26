"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { directionOf } from "../../../domain/content";
import type { MyTourBooking } from "../../../server/platform/booking";
import { Bdi } from "../../shared/bidi";
import { formatClock, formatNumber } from "../../shared/format";
import { LocalizedText, type LocalizedValue } from "../../shared/localized-text";
import { TourPrice, useTourDateFormat } from "../common";

const TABS = ["upcoming", "past", "cancelled"] as const;
type Tab = (typeof TABS)[number];

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("TourShared.bookingStatus");
  const tone =
    status === "confirmed" || status === "completed"
      ? "bg-emerald-100 text-emerald-900"
      : status === "pending_payment" || status === "requested"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-200 text-slate-700";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", tone)} data-testid="booking-status" data-status={status}>
      {t.has(status) ? t(status) : status}
    </span>
  );
}

/** My Bookings with accessible tabs (arrow keys move between tabs). */
export function BookingsList({ lists }: { lists: Record<Tab, MyTourBooking[]> }) {
  const t = useTranslations("TourApp.bookings");
  const tv = useTranslations("TourApp.voucher");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const rtl = directionOf(locale) === "rtl";
  const [tab, setTab] = useState<Tab>("upcoming");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const Chevron = rtl ? ChevronLeft : ChevronRight;

  function onKey(e: KeyboardEvent, i: number) {
    let next = i;
    if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = (i + 1) % TABS.length;
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next]);
    refs.current[TABS[next]]?.focus();
  }

  const items = lists[tab];
  return (
    <div className="px-4 pt-4 sm:px-6" data-testid="my-bookings">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      <div role="tablist" aria-label={t("tabs.label")} className="mt-4 flex gap-1 rounded-2xl bg-slate-100 p-1">
        {TABS.map((k, i) => (
          <button
            key={k}
            ref={(el) => {
              refs.current[k] = el;
            }}
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn("min-h-11 flex-1 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none", tab === k ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600")}
          >
            {t(`tabs.${k}`)} ({formatNumber(lists[k].length, locale)})
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-4" tabIndex={0}>
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">{t(`empty.${tab}`)}</p>
            <Link href="/tours/explore" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white">
              {t("explore")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((b) => (
              <li key={b.bookingId}>
                <Link
                  href={`/tours/bookings/${b.bookingId}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                  data-testid="booking-row"
                  data-booking-id={b.bookingId}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={b.status} />
                      <span className="text-xs text-slate-500">
                        {tv("voucherCode")}: <Bdi dir="ltr">{b.voucherCode}</Bdi>
                      </span>
                    </div>
                    <p className="truncate font-semibold text-slate-900">
                      <LocalizedText text={b.tour.title as LocalizedValue} badge={false} placeholder={b.tour.slug} />
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1" suppressHydrationWarning>
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {fmt.date(b.departure.localDate, "medium")} ({fmt.calendarName()})
                        {b.departure.localTime ? ` · ${formatClock(b.departure.localTime, locale)}` : ""}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden="true" />
                        {t("travelersCount", { count: b.seats })}
                      </span>
                      <TourPrice amount={b.totalAmount} currency={b.currency} className="font-semibold text-slate-800" />
                    </p>
                  </div>
                  <Chevron className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
