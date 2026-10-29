"use client";

import { CalendarDays, Car, HeartPulse, Hotel, Package, Plane, Stethoscope } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { formatMoney } from "@/features/finance/lib/money";
import { Link } from "@/i18n/navigation";

import type { JourneyPlan, JourneyStop } from "../types";

const STOP_ICON = { arrival: Plane, treatment: Stethoscope, recovery: HeartPulse, departure: Car } as const;
const ITEM_ICON = { treatment: Stethoscope, hotel: Hotel, transfer: Car, product: Package } as const;

export function AssistantJourneyCard({ plan }: { plan: JourneyPlan }) {
  const t = useTranslations("Assistant.journey");
  const locale = useLocale();
  const format = useFormatter();

  const money = (amount: number) => formatMoney({ amount, currencyCode: plan.currency }, { locale });
  const kindLabel = {
    arrival: t("kinds.arrival"),
    treatment: t("kinds.treatment"),
    recovery: t("kinds.recovery"),
    departure: t("kinds.departure"),
  };
  const dayLabel = (stop: JourneyStop) =>
    stop.dayFrom === stop.dayTo ? t("day", { day: stop.dayFrom }) : t("days", { from: stop.dayFrom, to: stop.dayTo });

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#eacb7f]/50 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 bg-gradient-to-br from-[#083f30] to-[#0a5a44] px-4 py-3 text-white">
        <CalendarDays size={18} className="shrink-0 text-[#eacb7f]" />
        <div className="min-w-0">
          <p className="text-sm font-bold">{t("title")}</p>
          <p className="truncate text-[11px] text-white/75">{plan.title}</p>
        </div>
      </div>

      <ol className="space-y-4 px-4 py-4">
        {plan.stops.map((stop, stopIndex) => {
          const StopIcon = STOP_ICON[stop.kind];
          return (
            <li key={stopIndex} className="relative flex gap-3">
              {stopIndex < plan.stops.length - 1 ? (
                <span aria-hidden="true" className="absolute -bottom-4 start-[15px] top-8 w-px bg-[#eacb7f]/60" />
              ) : null}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
                <StopIcon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#083f30]">
                  {dayLabel(stop)} · {kindLabel[stop.kind]}
                  {stop.date ? (
                    <span className="font-normal text-gray-500">
                      {" · "}
                      {format.dateTime(new Date(`${stop.date}T12:00:00Z`), { day: "numeric", month: "short" })}
                    </span>
                  ) : null}
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {stop.items.map((item, itemIndex) => {
                    const ItemIcon = ITEM_ICON[item.kind];
                    const subtitle = item.checkout
                      ? t("checkout")
                      : item.nights
                        ? [item.subtitle, t("nights", { count: item.nights })].filter(Boolean).join(" · ")
                        : item.subtitle;
                    return (
                      <div key={itemIndex} className="flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2">
                        <ItemIcon size={14} className="shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-900">{item.title}</p>
                          {subtitle ? <p className="truncate text-[11px] text-gray-500">{subtitle}</p> : null}
                        </div>
                        {item.showPrice ? (
                          <span className="shrink-0 text-[11px] font-bold text-[#083f30]">
                            {item.price > 0 ? money(item.price) : t("priceOnRequest")}
                          </span>
                        ) : null}
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="shrink-0 rounded-full bg-[#083f30] px-2.5 py-1 text-[10px] font-semibold text-white transition active:scale-95"
                          >
                            {t("book")}
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-600">{t("total")}</span>
          <span className="text-base font-bold text-[#083f30]">{money(plan.total)}</span>
        </div>
        <p className="mt-1 text-[10px] leading-4 text-gray-400">{plan.totalIsPartial ? t("partial") : t("note")}</p>
      </div>
    </div>
  );
}