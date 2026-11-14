"use client";

import { CalendarCheck2, Clock, Stethoscope } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export type BookingResult = {
  ok?: boolean;
  bookingUrl?: string;
  date?: string;
  time?: string;
  serviceName?: string;
  providerName?: string;
  specialistName?: string;
  service?: { name?: string };
  provider?: { name?: string };
  specialist?: { name?: string };
};

function withLocale(url: string, locale: string) {
  if (!url.startsWith("/") || url.startsWith(`/${locale}/`)) return url;
  return `/${locale}${url}`;
}

function formatDate(date: string | undefined, locale: string) {
  if (!date) return null;
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return date;
  const tag = locale === "fa" ? "fa-IR-u-ca-persian" : locale === "ar" ? "ar-u-nu-arab" : locale;
  return new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(value);
}

function formatTime(time: string | undefined, locale: string) {
  if (!time) return null;
  if (locale === "fa") return time.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  return time;
}

export function AssistantBookingCard({ booking }: { booking: BookingResult }) {
  const t = useTranslations("Assistant.booking");
  const locale = useLocale();
  if (!booking.bookingUrl) return null;

  const service = booking.serviceName ?? booking.service?.name;
  const provider = booking.providerName ?? booking.provider?.name;
  const specialist = booking.specialistName ?? booking.specialist?.name;
  const date = formatDate(booking.date, locale);
  const time = formatTime(booking.time, locale);

  return (
    <div className="w-full max-w-[90%] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#0a5a44]">
        <CalendarCheck2 size={15} />
        {t("title")}
      </div>
      <div className="space-y-1.5 px-3.5 py-3 text-sm text-gray-800">
        {service ? <p className="font-semibold">{service}</p> : null}
        {provider || specialist ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            <Stethoscope size={13} />
            {[provider, specialist].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {date || time ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            <Clock size={13} />
            {[date, time].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <p className="pt-1 text-[11px] leading-5 text-gray-500">{t("note")}</p>
      </div>
      <div className="px-3.5 pb-3.5">
        <a
          href={withLocale(booking.bookingUrl, locale)}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-[#083f30] text-sm font-bold text-white transition hover:bg-[#0a5a44]"
        >
          {t("button")}
        </a>
      </div>
    </div>
  );
}