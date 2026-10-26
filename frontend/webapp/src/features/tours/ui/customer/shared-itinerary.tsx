"use client";

import { Clock, Luggage, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { TourDetail } from "../../server/platform/catalog";
import { Bdi } from "../shared/bidi";
import { formatClock } from "../shared/format";
import { LocalizedText, type LocalizedValue } from "../shared/localized-text";

import { useTourDateFormat } from "./common";
import { Itinerary } from "./detail/itinerary";

type Props =
  | { state: "expired" }
  | {
      state: "ok";
      expiresAt: string;
      title: LocalizedValue;
      meetingText: LocalizedValue;
      meeting: { lat: number; lng: number } | null;
      departure: { localDate: string; localTime: string | null; timezone: string; status: string; delayMinutes: number };
      itinerary: TourDetail["itinerary"];
    };

export function SharedItinerary(props: Props) {
  const t = useTranslations("TourApp");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6" data-testid="shared-itinerary">
      <p className="flex items-center gap-2 font-bold text-emerald-900">
        <Luggage className="size-5" aria-hidden="true" />
        {t("nav.brand")}
      </p>
      {props.state === "expired" ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-700 ring-1 ring-slate-200" data-testid="share-expired">
          {t("share.expired")}
        </p>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-900">
            <LocalizedText text={props.title} placeholder={t("share.title")} />
          </h1>
          <p className="text-xs text-slate-500">{t("share.note")}</p>
          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
              <Clock className="size-4 text-emerald-700" aria-hidden="true" />
              {t("voucher.departure")}
            </h2>
            <p className="font-semibold" suppressHydrationWarning>
              {fmt.date(props.departure.localDate, "full")}
              {props.departure.localTime ? ` · ${formatClock(props.departure.localTime, locale)}` : ""}
            </p>
            <p className="text-xs text-slate-500" suppressHydrationWarning>
              {t("voucher.calendarName", { calendar: fmt.calendarName() })} · {t("voucher.timezone", { zone: props.departure.timezone })}
            </p>
            {props.departure.delayMinutes > 0 ? <p className="text-sm text-orange-700">{t("voucher.delayed", { minutes: props.departure.delayMinutes })}</p> : null}
          </section>
          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="shared-meeting">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
              <MapPin className="size-4 text-emerald-700" aria-hidden="true" />
              {t("voucher.meetingPoint")}
            </h2>
            {props.meetingText ? <LocalizedText text={props.meetingText} as="p" className="text-sm leading-6" /> : null}
            {props.meeting ? (
              <p className="text-xs text-slate-500">
                <Bdi dir="ltr">
                  {props.meeting.lat.toFixed(5)}, {props.meeting.lng.toFixed(5)}
                </Bdi>
              </p>
            ) : null}
          </section>
          {props.itinerary.length > 0 ? (
            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <h2 className="mb-3 text-sm font-bold">{t("voucher.itinerary")}</h2>
              <Itinerary stops={props.itinerary} timezone={props.departure.timezone} />
            </section>
          ) : null}
          <p className="text-xs text-slate-500" suppressHydrationWarning>
            {t("share.expires", { time: fmt.instant(props.expiresAt, props.departure.timezone) })}
          </p>
        </>
      )}
    </div>
  );
}
