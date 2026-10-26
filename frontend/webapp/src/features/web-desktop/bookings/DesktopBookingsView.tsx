"use client";

import Image from "next/image";
import { AlertCircle, ArrowLeft, BadgeCheck, CalendarX, Clock, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { formatCurrencyAmount } from "@/features/finance/lib/money";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { useFetchBookings } from "@/features/service-providers/api/client/fetch-bookings";
import type { Booking } from "@/features/service-providers/types";
import { Link } from "@/i18n/navigation";

import { CountUp, Reveal } from "../components/motion";

type Tab = "upcoming" | "past" | "cancelled";
const TABS: Tab[] = ["upcoming", "past", "cancelled"];

const normalize = (value?: string | null) => String(value || "pending").trim().toLowerCase();

function useBadges() {
  const t = useTranslations("Booking");
  const status = (value: string) => {
    const s = normalize(value);
    if (["confirmed", "completed", "done"].includes(s)) {
      return { text: s === "confirmed" ? t("confirmed") : t("completed"), className: "bg-[#e7f4ee] text-[#0f5a45]" };
    }
    if (["cancelled", "canceled"].includes(s)) return { text: t("cancelled"), className: "bg-[#fbeaea] text-[#a33a3a]" };
    return { text: t("pending"), className: "bg-[#fbf3de] text-[#8c6b2c]" };
  };
  const payment = (value: string) => {
    const s = normalize(value);
    if (s === "deposit_paid") return t("depositPaid");
    if (s === "partiallypaid") return t("partial");
    if (s === "paid") return t("paid");
    if (s === "refunded") return t("refunded");
    return t("paymentDue");
  };
  return { status, payment };
}

/** A booking as a ticket: body + perforated stub with date, time and total. */
function Ticket({ booking, featured = false }: { booking: Booking; featured?: boolean }) {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const { status, payment } = useBadges();
  const statusBadge = status(booking.status);
  const image = resolveHomeMediaUrl(booking.image);
  const money = (amount: number) => formatCurrencyAmount(amount || 0, booking.currency || "USD", locale, { maximumFractionDigits: 2 });
  const depositPaid = normalize(booking.paymentStatus) === "deposit_paid";

  return (
    <Link href={`/n/app/mobile/bookings/${booking.id}`} className="lsd-ticket-shadow group block">
      <div className={`lsd-ticket grid grid-cols-[74fr_26fr] overflow-hidden rounded-[28px] bg-white ${featured ? "min-h-[260px]" : "min-h-[190px]"}`}>
        {/* Body */}
        <div className="flex gap-6 p-7">
          <div className={`relative shrink-0 overflow-hidden rounded-t-full rounded-b-[20px] bg-[#0f5a45] ${featured ? "h-[200px] w-[150px]" : "h-[136px] w-[104px]"}`}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <Image src="/brand/lsevin-mark-reversed.png" alt="" width={34} height={48} className="opacity-50" />
              </div>
            )}
            {booking.verified ? (
              <span className="absolute bottom-2 start-1/2 grid h-7 w-7 place-items-center rounded-full bg-[#eacb7f] text-[#062a20] rtl:translate-x-1/2 ltr:-translate-x-1/2">
                <BadgeCheck size={15} />
              </span>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge.className}`}>{statusBadge.text}</span>
              <span className="rounded-full bg-[#062a20] px-3 py-1 text-xs font-bold text-[#eacb7f]">{payment(booking.paymentStatus)}</span>
            </div>
            <h3 className={`mt-4 line-clamp-2 font-black leading-snug text-[#0e1a16] ${featured ? "text-[28px]" : "text-lg"}`}>{booking.service}</h3>
            <p className="mt-1 truncate text-[15px] text-[#56675f]">{booking.provider}</p>
            {booking.location ? (
              <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-[#56675f]">
                <MapPin size={15} className="shrink-0 text-[#c9a55a]" />
                {booking.location}
              </p>
            ) : null}
            {depositPaid ? (
              <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs">
                <span className="text-[#0f5a45]">
                  {t("paidOnline")}: <b>{money(booking.paidAmount ?? 0)}</b>
                </span>
                <span className="text-[#8c6b2c]">
                  {t("payAtPlace")}: <b>{money(Math.max(booking.price - (booking.paidAmount ?? 0), 0))}</b>
                </span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Stub */}
        <div className="relative my-5 flex flex-col justify-between border-s-2 border-dashed border-[#e3dccb] px-6 py-2 text-center">
          <div>
            <p className={`font-black leading-tight text-[#083f30] ${featured ? "text-2xl" : "text-lg"}`}>{booking.date}</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-[#8c6b2c]">
              <Clock size={14} />
              {booking.time}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#8fa79d]">{t("total")}</p>
            <p className={`font-black text-[#0e1a16] [overflow-wrap:anywhere] ${featured ? "text-xl" : "text-base"}`}>{money(booking.price)}</p>
            <p className="mt-2 truncate font-mono text-[10px] tracking-wider text-[#a8b3ae]">#{booking.id.slice(0, 8)}</p>
          </div>
          <ArrowLeft size={18} className="absolute end-4 top-1/2 -translate-y-1/2 text-[#c9a55a] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180" />
        </div>
      </div>
    </Link>
  );
}

/** Desktop bookings (>= 1280px): same data and tabs as mobile, as a travel journal of tickets. */
export function DesktopBookingsView() {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data, error, isFetching, refetch } = useFetchBookings({} as Parameters<typeof useFetchBookings>[0]);

  const lists: Record<Tab, Booking[]> = useMemo(
    () => ({
      upcoming: data?.upcomingBookings ?? [],
      past: data?.pastBookings ?? [],
      cancelled: data?.cancelledBookings ?? [],
    }),
    [data]
  );
  const current = lists[tab];
  const [next, ...rest] = tab === "upcoming" ? current : [];
  const others = tab === "upcoming" ? rest : current;

  const emptyTitle = tab === "upcoming" ? t("noUpcomingBookings") : tab === "past" ? t("noPastBookings") : t("noCancelledBookings");
  const emptyText =
    tab === "upcoming" ? t("noUpcomingAppointmentsExploreServices") : tab === "past" ? t("completedBookingsWillAppearHere") : t("cancelledBookingsWillAppearHere");

  return (
    <div className="lsd hidden pb-20 xl:block">
      {/* Header */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative overflow-hidden rounded-[40px] px-14 py-12 text-white">
          <div className="lsd-girih absolute inset-0" aria-hidden="true" />
          <div className="relative flex items-end justify-between gap-10">
            <Reveal className="space-y-3">
              <span className="text-[11px] font-bold tracking-[0.35em] text-[#eacb7f]">L SEVIN JOURNEYS</span>
              <h1 className="text-[44px] font-black leading-tight">{t("myBookings")}</h1>
              <p className="max-w-md text-base text-white/70">{t("manageYourAppointmentsAndBookingRequests")}</p>
            </Reveal>

            <div className="flex items-stretch gap-3">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`lsd-glass min-w-[130px] rounded-[22px] px-6 py-4 text-start transition hover:-translate-y-0.5 ${
                    tab === id ? "ring-2 ring-[#eacb7f]" : ""
                  }`}
                >
                  <p className="text-3xl font-black text-[#eacb7f]">
                    <CountUp value={lists[id].length} locale={locale} />
                  </p>
                  <p className="mt-1 text-sm text-white/75">{t(id)}</p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label={t("refreshBookings")}
                className="grid w-14 place-items-center rounded-[22px] bg-white/10 transition hover:bg-white/20 disabled:opacity-60"
              >
                {isFetching ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-24 z-20 mt-8">
        <div className="lsd-container">
          <div className="flex w-fit gap-1 rounded-full bg-white/90 p-1.5 shadow-sm ring-1 ring-[#dce4e0] backdrop-blur-md">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
                  tab === id ? "bg-[#083f30] text-[#eacb7f]" : "text-[#56675f] hover:text-[#083f30]"
                }`}
              >
                {t(id)} <span className="opacity-70">({new Intl.NumberFormat(locale).format(lists[id].length)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="lsd-container mt-10">
        {error ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <span className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#fbeaea] text-[#a33a3a]">
              <AlertCircle size={32} />
            </span>
            <h3 className="text-xl font-black text-[#0e1a16]">{t("bookingsCouldNotBeLoaded")}</h3>
            <p className="mt-2 text-sm text-[#56675f]">{error.detail || error.title || t("pleaseRefreshAndTryAgain")}</p>
            <button type="button" onClick={() => refetch()} className="lsd-btn lsd-btn-green mt-6 h-12 px-8 text-sm">
              {t("tryAgain")}
            </button>
          </div>
        ) : isFetching && !data ? (
          <div className="space-y-6">
            <div className="h-[260px] animate-pulse rounded-[28px] bg-white/70" />
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[190px] animate-pulse rounded-[28px] bg-white/70" />
              ))}
            </div>
          </div>
        ) : current.length ? (
          <div className="space-y-10">
            {next ? (
              <Reveal>
                <Ticket booking={next} featured />
              </Reveal>
            ) : null}
            {others.length ? (
              <div className="grid grid-cols-2 gap-6">
                {others.map((booking, index) => (
                  <Reveal key={booking.id} delay={(index % 2) * 90}>
                    <Ticket booking={booking} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <span className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-white text-[#c9a55a] ring-1 ring-[#e3dccb]">
              <CalendarX size={32} />
            </span>
            <h3 className="text-xl font-black text-[#0e1a16]">{emptyTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-[#56675f]">{emptyText}</p>
            {tab === "upcoming" ? (
              <Link href="/n/app/mobile/explore" className="lsd-btn lsd-btn-gold mt-6 h-12 px-8 text-sm">
                {t("exploreServices")}
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}