"use client";
import { useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Calendar, CalendarX, ChevronRight, CheckCircle, Clock, Loader2, MapPin, RefreshCw, XCircle, } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { useFetchBookings } from "@/features/service-providers/api/client/fetch-bookings";
import type { Booking } from "@/features/service-providers/types";
import { useNavigate } from "@/hooks/use-navigate";
import { useTranslations } from "next-intl";
const BRAND_GREEN = "#083f30";
type BookingTab = "upcoming" | "past" | "cancelled";
const TABS: Array<{
    id: BookingTab;
    labelKey: "upcoming" | "past" | "cancelled";
}> = [
    { id: "upcoming", labelKey: "upcoming" },
    { id: "past", labelKey: "past" },
    { id: "cancelled", labelKey: "cancelled" },
];
function normalizeStatus(value?: string | null) {
    return String(value || "pending").trim().toLowerCase();
}
function buildFileUrl(value?: string | null) {
    return resolveHomeMediaUrl(value);
}
function formatMoney(amount: number, currency?: string | null) {
    const code = String(currency || "USD").trim().toUpperCase();
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    }
    catch {
        return `${(amount || 0).toLocaleString()} ${code}`;
    }
}
function getStatusBadge(status: string, tBooking: ReturnType<typeof useTranslations>) {
    const normalized = normalizeStatus(status);
    if (["confirmed", "completed", "done"].includes(normalized)) {
        return {
            icon: CheckCircle,
            text: normalized === "completed" || normalized === "done" ? tBooking("completed") : tBooking("confirmed"),
            color: "bg-green-50 text-green-700",
        };
    }
    if (["cancelled", "canceled"].includes(normalized)) {
        return { icon: XCircle, text: tBooking("cancelled"), color: "bg-red-50 text-red-700" };
    }
    return { icon: AlertCircle, text: tBooking("pending"), color: "bg-yellow-50 text-yellow-700" };
}
function getPaymentBadge(status: string, tBooking: ReturnType<typeof useTranslations>) {
    const normalized = normalizeStatus(status);
    if (normalized === "paid")
        return { text: tBooking("paid"), color: "bg-green-600" };
    if (normalized === "refunded")
        return { text: tBooking("refunded"), color: "bg-gray-600" };
    return { text: tBooking("paymentDue"), color: "bg-yellow-600" };
}
function BookingCard({ booking, onOpen }: {
    booking: Booking;
    onOpen: () => void;
}) {
    const tBooking = useTranslations("Booking");
    const statusBadge = getStatusBadge(booking.status, tBooking);
    const paymentBadge = getPaymentBadge(booking.paymentStatus, tBooking);
    const StatusIcon = statusBadge.icon;
    const imageSrc = buildFileUrl(booking.image);
    return (<button type="button" onClick={onOpen} className="w-full cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#083f30]/20">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${statusBadge.color}`}>
              <StatusIcon size={14}/>
              <span className="text-xs font-semibold">{statusBadge.text}</span>
            </div>
            <div className={`rounded-lg px-2.5 py-1 ${paymentBadge.color}`}>
              <span className="text-xs font-semibold text-white">{paymentBadge.text}</span>
            </div>
          </div>
          <ChevronRight size={20} className="mt-0.5 flex-shrink-0 text-gray-400 rtl:rotate-180"/>
        </div>

        <div className="flex gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {imageSrc ? (<ImageWithFallback fill src={imageSrc} alt={booking.service} className="object-cover" sizes="80px" fallbackClassName="rounded-xl"/>) : (<div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-300">
                {booking.service.slice(0, 1).toUpperCase()}
              </div>)}
            {booking.verified && (<div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#083f30] shadow-lg">
                <BadgeCheck size={14} className="text-[#eacb7f]"/>
              </div>)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="mb-1 line-clamp-1 font-bold text-gray-900">{booking.service}</h3>
            <p className="mb-2 line-clamp-1 text-sm text-gray-600">{booking.provider}</p>

            <div className="space-y-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <Calendar size={14} className="flex-shrink-0 text-gray-400"/>
                <span className="truncate text-sm font-medium text-gray-700">{booking.date}</span>
                <span className="text-gray-300">•</span>
                <Clock size={14} className="flex-shrink-0 text-gray-400"/>
                <span className="truncate text-sm font-medium text-gray-700">{booking.time}</span>
              </div>

              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin size={14} className="flex-shrink-0 text-gray-400"/>
                <span className="line-clamp-1 text-sm text-gray-600">{booking.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <div className="min-w-0">
            <span className="text-xs text-gray-500">{tBooking("bookingID")}</span>
            <p className="truncate text-sm font-semibold text-gray-900">{booking.id}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-xs text-gray-500">{tBooking("total")}</span>
            <p className="text-lg font-bold text-[#083f30]">{formatMoney(booking.price, booking.currency)}</p>
          </div>
        </div>
      </div>
    </button>);
}
export default function Bookings() {
    const tBooking = useTranslations("Booking");
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
    const { data, error, isFetching, refetch } = useFetchBookings({});
    const counts = useMemo(() => ({
        upcoming: data?.upcomingBookings.length ?? 0,
        past: data?.pastBookings.length ?? 0,
        cancelled: data?.cancelledBookings.length ?? 0,
    }), [data]);
    const bookings = useMemo(() => {
        if (activeTab === "past")
            return data?.pastBookings ?? [];
        if (activeTab === "cancelled")
            return data?.cancelledBookings ?? [];
        return data?.upcomingBookings ?? [];
    }, [activeTab, data]);
    return (<div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white px-5 pb-4 pt-3">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tBooking("myBookings")}</h1>
            <p className="mt-0.5 text-sm text-gray-600">{tBooking("manageYourAppointmentsAndBookingRequests")}</p>
          </div>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60" aria-label={tBooking("refreshBookings")}>
            {isFetching ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18}/>}
          </button>
        </div>

        <div className="flex gap-2">
          {TABS.map((tab) => (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.id
                ? "bg-[#083f30] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {tBooking(tab.labelKey)}
              <span className={`ms-1.5 ${activeTab === tab.id ? "opacity-80" : "opacity-60"}`}>({counts[tab.id]})</span>
            </button>))}
        </div>
      </div>

      {error ? (<div className="px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={32} className="text-red-500"/>
          </div>
          <h3 className="mb-2 font-bold text-gray-900">{tBooking("bookingsCouldNotBeLoaded")}</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-gray-600">{error.detail || error.title || tBooking("pleaseRefreshAndTryAgain")}</p>
          <button type="button" onClick={() => refetch()} className="rounded-xl bg-[#083f30] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0a5a44]">{tBooking("tryAgain")}</button>
        </div>) : isFetching && !data ? (<div className="space-y-3 px-5 py-4">
          {[1, 2, 3].map((item) => (<div key={item} className="h-44 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"/>))}
        </div>) : bookings.length > 0 ? (<div className="space-y-3 px-5 py-4">
          {bookings.map((booking) => (<BookingCard key={booking.id} booking={booking} onOpen={() => navigate(`/n/app/mobile/bookings/${booking.id}`)}/>))}
        </div>) : (<div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <CalendarX size={32} className="text-gray-400"/>
          </div>
          <h3 className="mb-2 font-bold text-gray-900">{activeTab === "upcoming" ? tBooking("noUpcomingBookings") : activeTab === "past" ? tBooking("noPastBookings") : tBooking("noCancelledBookings")}</h3>
          <p className="mx-auto mb-6 max-w-sm text-gray-600">
            {activeTab === "upcoming"
                ? tBooking("noUpcomingAppointmentsExploreServices")
                : activeTab === "past"
                    ? tBooking("completedBookingsWillAppearHere")
                    : tBooking("cancelledBookingsWillAppearHere")}
          </p>
          {activeTab === "upcoming" && (<button type="button" onClick={() => navigate("/n/app/mobile/explore")} className="rounded-xl bg-[#083f30] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0a5a44]" style={{ backgroundColor: BRAND_GREEN }}>{tBooking("exploreServices")}</button>)}
        </div>)}
    </div>);
}
