"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertCircle, BadgeCheck, Calendar, CheckCircle, ChevronLeft, Clock, CreditCard, Download, FileText, Loader2, Mail, MapPin, MessageCircle, Navigation, PackageCheck, Phone, RefreshCw, ReceiptText, UserRound, XCircle, } from "lucide-react";
import { toast } from "sonner";
import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { cancelBookingAction } from "@/booking/actions/cancel-booking";
import { getEnabledPaymentGatewaysAction } from "@/payment/actions/get-enabled-payment-gateways";
import type { AvailablePaymentGateway } from "@/payment/actions/get-enabled-payment-gateways/types";
import { initiateBookingPaymentAction } from "@/payment/actions/initiate-booking-payment";
import { useFetchGetBookingById } from "@/features/service-providers/api/client/fetch-getBookingById";
import type { BookingAddonSummary, BookingChildSummary, BookingDocumentSummary, BookingRecord } from "@/features/service-providers/types";
import { useRouter } from "@/i18n/navigation";
import useAction from "@/hooks/use-action";
import { useNavigate } from "@/hooks/use-navigate";
import { useLocale, useTranslations } from "next-intl";
function normalizeStatus(value?: string | null) {
    return String(value || "pending").trim().toLowerCase();
}
function buildFileUrl(value?: string | null) {
    return resolveHomeMediaUrl(value);
}
function resolveIntlLocale(locale?: string | null) {
    const normalized = (locale || "fa").trim().toLowerCase();
    const map: Record<string, string> = {
        fa: "fa-IR", en: "en-US", ar: "ar-SA", tr: "tr-TR", de: "de-DE",
        fr: "fr-FR", es: "es-ES", ku: "ku-KU", ru: "ru-RU", tg: "tg-TJ", zh: "zh-CN",
    };
    return map[normalized] || normalized || "fa-IR";
}
// Intl's currency formatter has no reliable localized display name for IRR across
// environments -- it falls back to printing the raw ISO code "IRR" instead of a real
// unit name. Rial is the actual unit the stored amount is denominated in (no /10
// conversion to Toman -- that would silently change the displayed number).
function formatMoney(amount?: number | null, currency?: string | null, locale?: string | null) {
    const code = String(currency || "USD").trim().toUpperCase();
    const value = Number(amount || 0);
    const localeTag = resolveIntlLocale(locale);
    if (code === "IRR") {
        const formattedNumber = new Intl.NumberFormat(localeTag).format(value);
        return `${formattedNumber} ${localeTag.startsWith("fa") ? "ریال" : "Rial"}`;
    }
    try {
        return new Intl.NumberFormat(localeTag, {
            style: "currency",
            currency: code,
            maximumFractionDigits: 2,
        }).format(value);
    }
    catch {
        return `${value.toLocaleString(localeTag)} ${code}`;
    }
}
// createBookingPaymentIntent/booking.bookings.payment_method return raw codes
// ('pay_on_delivery', 'bank_receipt', 'wallet', ...) meant for logic, not display --
// same mapping BookingWizard.tsx uses for the checkout-step summary. Anything unmapped
// (an online gateway's own code/provider name) falls back to the raw value since those
// are typically brand names (Zarinpal, BTCPay).
const PAYMENT_METHOD_LABEL_KEYS: Record<string, string> = {
    pay_on_delivery: "paymentMethodPayOnDelivery",
    bank_receipt: "paymentMethodBankReceipt",
    wallet: "wallet",
};
const BOOKING_PAYMENT_STATUS_LABEL_KEYS: Record<string, string> = {
    pending: "pending",
    paid: "paid",
    partiallypaid: "partial",
    refunded: "refunded",
    failed: "failed",
    notrequired: "notRequired",
};
function translateWithFallback(t: ReturnType<typeof useTranslations>, map: Record<string, string>, raw?: string | null) {
    const key = map[String(raw || "").toLowerCase()];
    return key ? t(key as never) : (raw || "");
}
function getStatusBadge(status: string | null | undefined, tBooking: ReturnType<typeof useTranslations>) {
    const normalized = normalizeStatus(status);
    if (["confirmed", "completed", "done"].includes(normalized)) {
        return {
            icon: CheckCircle,
            text: normalized === "completed" || normalized === "done" ? tBooking("completed") : tBooking("confirmed"),
            color: "bg-green-50 text-green-700 border-green-200",
            helper: normalized === "completed" || normalized === "done" ? tBooking("thisAppointmentHasBeenCompleted") : tBooking("bookingConfirmedByTheProvider"),
        };
    }
    if (["cancelled", "canceled"].includes(normalized)) {
        return {
            icon: XCircle,
            text: tBooking("cancelled"),
            color: "bg-red-50 text-red-700 border-red-200",
            helper: tBooking("thisBookingHasBeenCancelled"),
        };
    }
    return {
        icon: AlertCircle,
        text: tBooking("pendingConfirmation"),
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        helper: tBooking("providerReviewingYourAppointmentRequest"),
    };
}
function DescriptionBlock({ title, content }: {
    title: string;
    content?: string | null;
}) {
    if (!content)
        return null;
    return (<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {hasLexicalContent(content) ? (<LexicalRenderer content={content} className="text-sm leading-6 text-gray-700"/>) : (<p className="text-sm leading-6 text-gray-700">{content || "-"}</p>)}
    </div>);
}
function DetailRow({ label, value }: {
    label: string;
    value?: string | null;
}) {
    return (<div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-gray-900">{value || "-"}</span>
    </div>);
}
function AddonsList({ addons, currency }: {
    addons?: BookingAddonSummary[];
    currency?: string;
}) {
    const tBooking = useTranslations("Booking");
    const locale = useLocale();
    if (!addons?.length)
        return null;
    return (<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <PackageCheck size={20} className="text-[#083f30]"/>
        <h3 className="font-bold text-gray-900">{tBooking("selectedAddOns")}</h3>
      </div>
      <div className="space-y-2">
        {addons.map((addon) => (<div key={addon.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{addon.name}</p>
              <p className="text-xs text-gray-500">{tBooking("quantity")}{addon.quantity}</p>
            </div>
            <span className="flex-shrink-0 font-bold text-[#083f30]">
              {formatMoney(Number(addon.unitPrice || 0) * Number(addon.quantity || 1), addon.currency || currency, locale)}
            </span>
          </div>))}
      </div>
    </div>);
}
function ChildBookingsList({ items }: {
    items?: BookingChildSummary[];
}) {
    const tBooking = useTranslations("Booking");
    if (!items?.length)
        return null;
    return (<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ReceiptText size={20} className="text-[#083f30]"/>
        <h3 className="font-bold text-gray-900">{tBooking("relatedBookings")}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (<div key={item.id} className="rounded-xl bg-gray-50 p-3">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{item.service}</p>
                <p className="truncate text-xs text-gray-600">{item.provider}</p>
              </div>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-gray-600">{item.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar size={13}/>
              <span>{item.date}</span>
              <Clock size={13}/>
              <span>{item.time}</span>
            </div>
          </div>))}
      </div>
    </div>);
}
function DocumentsList({ documents }: {
    documents?: BookingDocumentSummary[];
}) {
    const tBooking = useTranslations("Booking");
    if (!documents?.length)
        return null;
    return (<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <FileText size={20} className="text-[#083f30]"/>
        <h3 className="font-bold text-gray-900">{tBooking("uploadedDocuments")}</h3>
      </div>
      <div className="space-y-2">
        {documents.map((document) => {
            const href = buildFileUrl(document.fileUrl);
            return (<a key={document.id} href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{document.title || document.fileName}</p>
                <p className="truncate text-xs text-gray-500">{document.fileName}</p>
              </div>
              <Download size={18} className="flex-shrink-0 text-gray-500"/>
            </a>);
        })}
      </div>
    </div>);
}
function BookingDetailContent({ booking, onCancel, onPay, isPaying, paymentGateway, }: {
    booking: BookingRecord;
    onCancel: () => void;
    onPay: (gateway: AvailablePaymentGateway) => void;
    isPaying: boolean;
    paymentGateway?: AvailablePaymentGateway | null;
}) {
    const tBooking = useTranslations("Booking");
    const locale = useLocale();
    const navigate = useNavigate();
    const imageSrc = buildFileUrl(booking.providerImage || booking.image);
    const agentImageSrc = buildFileUrl(booking.agent?.image);
    const statusBadge = getStatusBadge(booking.status, tBooking);
    const StatusIcon = statusBadge.icon;
    const normalizedBookingStatus = normalizeStatus(booking.status);
    const normalizedPaymentStatus = normalizeStatus(booking.paymentStatus);
    const canCancel = !["cancelled", "canceled", "completed", "done"].includes(normalizedBookingStatus);
    const canPay = Boolean(paymentGateway) && Number(booking.remaining || 0) > 0 && !["paid", "succeeded", "captured", "completed", "refunded"].includes(normalizedPaymentStatus) && !["cancelled", "canceled", "completed", "done"].includes(normalizedBookingStatus);
    const directionsHref = booking.fullAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.fullAddress)}`
        : undefined;
    return (<div className="px-5 py-4 space-y-4">
      <div className={`rounded-2xl border-2 p-4 ${statusBadge.color}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <StatusIcon size={24}/>
          </div>
          <div className="flex-1">
            <h3 className="font-bold">{statusBadge.text}</h3>
            <p className="text-sm opacity-80">{statusBadge.helper}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="relative h-48 bg-gray-100">
          {imageSrc ? (<ImageWithFallback fill src={imageSrc} alt={booking.service} className="object-cover" sizes="100vw" fallbackClassName="rounded-none"/>) : (<div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-300">
              {booking.service.slice(0, 1).toUpperCase()}
            </div>)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="mb-1 line-clamp-2 text-xl font-bold text-white">{booking.service}</h2>
            <div className="flex items-center gap-2">
              <span className="line-clamp-1 text-white/90">{booking.provider}</span>
              {booking.verified && (<div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#083f30]">
                  <BadgeCheck size={14} className="text-[#eacb7f]"/>
                </div>)}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <h3 className="mb-3 font-bold text-gray-900">{tBooking("appointmentDetails")}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <Calendar size={20} className="text-[#083f30]"/>
                <div>
                  <p className="text-xs text-gray-600">{tBooking("date2")}</p>
                  <p className="font-semibold text-gray-900">{booking.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <Clock size={20} className="text-[#083f30]"/>
                <div>
                  <p className="text-xs text-gray-600">{tBooking("time")}</p>
                  <p className="font-semibold text-gray-900">
                    {booking.time}{booking.duration ? ` • ${booking.duration}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <MapPin size={20} className="flex-shrink-0 text-[#083f30]"/>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-xs text-gray-600">{tBooking("location")}</p>
              <p className="mb-0.5 font-semibold text-gray-900">{booking.location}</p>
              <p className="line-clamp-2 text-xs text-gray-600">{booking.fullAddress || tBooking("addressWillBeSharedByProvider")}</p>
            </div>
            {directionsHref && (<a href={directionsHref} target="_blank" rel="noreferrer" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#083f30]" aria-label={tBooking("openDirections")}>
                <Navigation size={16} className="text-white"/>
              </a>)}
          </div>
        </div>
      </div>

      {booking.agent && (<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-gray-900">{tBooking("yourSpecialist")}</h3>
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gray-100">
              {agentImageSrc ? (<ImageWithFallback fill src={agentImageSrc} alt={booking.agent.name} className="object-cover" sizes="56px"/>) : (<div className="flex h-full w-full items-center justify-center text-gray-400">
                  <UserRound size={24}/>
                </div>)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-gray-900">{booking.agent.name}</p>
              <p className="truncate text-sm text-gray-600">{booking.agent.title}</p>
              {booking.agent.experience && <p className="text-xs font-medium text-[#083f30]">{booking.agent.experience}{tBooking("experience2")}</p>}
            </div>
          </div>
        </div>)}

      <DescriptionBlock title={tBooking("serviceDescription")} content={booking.serviceDescription}/>
      <DescriptionBlock title={tBooking("providerDescription")} content={booking.providerDescription}/>

      {booking.included && booking.included.length > 0 && (<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-gray-900">{tBooking("packageIncludes")}</h3>
          <div className="space-y-2">
            {booking.included.map((item, idx) => (<div key={`${item.title}-${idx}`} className="flex items-start gap-2">
                <CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-green-600"/>
                <span className="text-sm text-gray-700">{item.title || item.name}</span>
              </div>))}
          </div>
        </div>)}

      <AddonsList addons={booking.addons} currency={booking.currency}/>
      <ChildBookingsList items={booking.childBookings}/>
      <DocumentsList documents={booking.documents}/>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <CreditCard size={20} className="text-[#083f30]"/>
          <h3 className="font-bold text-gray-900">{tBooking("paymentSummary")}</h3>
        </div>

        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{tBooking("totalAmount")}</span>
            <span className="font-semibold text-gray-900">{formatMoney(booking.price, booking.currency, locale)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{tBooking("paidAmount")}</span>
            <span className="font-semibold text-green-600">-{formatMoney(booking.deposit || 0, booking.currency, locale)}</span>
          </div>
          <div className="my-2 h-px bg-gray-200"/>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">{tBooking("remaining")}</span>
            <span className="text-xl font-bold text-[#083f30]">{formatMoney(booking.remaining || 0, booking.currency, locale)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-xs text-green-700">
            <span className="font-semibold">{tBooking("paymentStatus")}</span> {translateWithFallback(tBooking, BOOKING_PAYMENT_STATUS_LABEL_KEYS, booking.paymentStatus) || tBooking("pending")}
            {booking.paymentMethod ? ` • ${translateWithFallback(tBooking, PAYMENT_METHOD_LABEL_KEYS, booking.paymentMethod)}` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-gray-900">{tBooking("contactProvider")}</h3>
        <div className="space-y-2">
          {booking.contact?.phone && (<a href={`tel:${booking.contact.phone}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#083f30]">
                <Phone size={18} className="text-white"/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">{tBooking("phone")}</p>
                <p className="truncate font-semibold text-gray-900">{booking.contact.phone}</p>
              </div>
            </a>)}

          {booking.contact?.email && (<a href={`mailto:${booking.contact.email}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#083f30]">
                <Mail size={18} className="text-white"/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">{tBooking("email")}</p>
                <p className="truncate font-semibold text-gray-900">{booking.contact.email}</p>
              </div>
            </a>)}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-gray-900">{tBooking("bookingInformation")}</h3>
        <div className="space-y-2">
          <DetailRow label={tBooking("bookingID")} value={booking.id}/>
          <DetailRow label={tBooking("confirmationCode")} value={booking.confirmationCode}/>
          <DetailRow label={tBooking("bookedOn")} value={booking.bookingDate}/>
          <DetailRow label={tBooking("status")} value={booking.status}/>
        </div>
      </div>

      <div className="space-y-2">
        {canPay && (<button type="button" disabled={isPaying} onClick={() => paymentGateway && onPay(paymentGateway)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#083f30] font-semibold text-white transition-colors hover:bg-[#0a5a44] disabled:cursor-not-allowed disabled:opacity-70">
            {isPaying ? <Loader2 size={18} className="animate-spin"/> : <CreditCard size={20}/>}
            {paymentGateway ? tBooking("payWithGateway", { gateway: paymentGateway.displayName }) : tBooking("paymentUnavailable")}
          </button>)}

        <button type="button" onClick={() => window.print()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 font-semibold text-white transition-colors hover:bg-black">
          <Download size={20}/>{tBooking("downloadConfirmation")}</button>

        <button type="button" onClick={() => navigate("/n/app/mobile/support")} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-100 font-semibold text-gray-900 transition-colors hover:bg-gray-200">
          <MessageCircle size={20}/>{tBooking("contactSupport")}</button>

        {canCancel && (<button type="button" onClick={onCancel} className="h-12 w-full rounded-xl border-2 border-red-200 font-semibold text-red-600 transition-colors hover:bg-red-50">{tBooking("cancelBooking")}</button>)}
      </div>
    </div>);
}
export default function BookingDetail() {
    const tBooking = useTranslations("Booking");
    const router = useRouter();
    const navigate = useNavigate();
    const searchParams = useSearchParams();
    const params = useParams<{
        id: string;
    }>();
    const id = String(params?.id || "").trim();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isPaymentPending, startPaymentTransition] = useTransition();
    const [enabledPaymentGateways, setEnabledPaymentGateways] = useState<AvailablePaymentGateway[]>([]);
    const { data, error, isFetching, refetch } = useFetchGetBookingById({ id });
    const booking = data?.booking;
    const { execute: executeCancelBooking } = useAction(cancelBookingAction, {
        startTransition,
        onSuccess: () => {
            toast.success(tBooking("bookingCancelledSuccessfully"));
            setShowCancelModal(false);
            setCancelReason("");
            refetch();
            navigate("/n/app/mobile/bookings");
        },
        onError: (actionError) => {
            toast.error(actionError?.detail || actionError?.title || tBooking("bookingCouldNotBeCancelled"));
        },
    });
    const { execute: executeLoadPaymentGateways } = useAction(getEnabledPaymentGatewaysAction, {
        onSuccess: (gateways) => {
            setEnabledPaymentGateways(gateways || []);
        },
        onError: () => {
            setEnabledPaymentGateways([]);
        },
    });
    const { execute: executeInitiatePayment } = useAction(initiateBookingPaymentAction, {
        startTransition: startPaymentTransition,
        onSuccess: (payment) => {
            if (!payment?.redirectUrl) {
                toast.error(tBooking("paymentGatewayDidNotReturnARedirectURL"));
                return;
            }
            window.location.assign(payment.redirectUrl);
        },
        onError: (actionError) => {
            toast.error(actionError?.detail || actionError?.title || tBooking("paymentCouldNotBeStarted"));
        },
    });
    useEffect(() => {
        executeLoadPaymentGateways({});
    }, [executeLoadPaymentGateways]);
    useEffect(() => {
        const paymentStatus = searchParams.get("payment");
        if (paymentStatus === "succeeded") {
            toast.success(tBooking("paymentVerifiedSuccessfully"));
            refetch();
        }
        else if (paymentStatus === "failed") {
            toast.error(searchParams.get("message") || tBooking("paymentVerificationFailed"));
        }
        else if (paymentStatus === "cancelled") {
            toast.info(tBooking("paymentWasCancelled"));
        }
    }, [searchParams, refetch]);
    const cancelSummary = useMemo(() => {
        if (!booking)
            return "";
        return tBooking("bookingSummaryDateTime", { service: booking.service, date: booking.date, time: booking.time });
    }, [booking, tBooking]);
    return (<div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="px-5 pb-4 pt-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
              <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180"/>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900">{tBooking("bookingDetails")}</h1>
              <p className="truncate text-sm text-gray-600">{id || "-"}</p>
            </div>

            <button type="button" onClick={() => refetch()} disabled={isFetching} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60" aria-label={tBooking("refreshBooking")}>
              {isFetching ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18}/>}
            </button>
          </div>
        </div>
      </div>

      {error ? (<div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={32} className="text-red-500"/>
          </div>
          <h3 className="mb-2 font-bold text-gray-900">{tBooking("bookingCouldNotBeLoaded")}</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-gray-600">{error.detail || error.title || tBooking("pleaseRefreshAndTryAgain")}</p>
          <button type="button" onClick={() => refetch()} className="rounded-xl bg-[#083f30] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0a5a44]">{tBooking("tryAgain")}</button>
        </div>) : isFetching && !booking ? (<div className="space-y-4 px-5 py-4">
          <div className="h-20 animate-pulse rounded-2xl bg-white"/>
          <div className="h-72 animate-pulse rounded-2xl bg-white"/>
          <div className="h-32 animate-pulse rounded-2xl bg-white"/>
        </div>) : booking ? (<BookingDetailContent booking={booking} onCancel={() => setShowCancelModal(true)} onPay={(gateway) => executeInitiatePayment({ bookingId: booking.id, gateway: gateway.code })} isPaying={isPaymentPending} paymentGateway={enabledPaymentGateways[0] || null}/>) : null}

      {showCancelModal && booking && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <AlertCircle size={24} className="text-red-600"/>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{tBooking("cancelBooking2")}</h2>
                </div>
                <button type="button" onClick={() => setShowCancelModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                  <XCircle size={24} className="text-gray-500"/>
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="mb-4 text-gray-700">{tBooking("areYouSureYouWantToCancelThisBooking")}</p>

              <div className="mb-4 rounded-2xl bg-gray-50 p-4">
                <p className="mb-1 text-sm text-gray-600">{tBooking("booking")}</p>
                <p className="mb-2 font-bold text-gray-900">{booking.service}</p>
                <p className="text-sm text-gray-600">{cancelSummary}</p>
              </div>

              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">{tBooking("cancellationReason")}</span>
                <textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder={tBooking("optionalNoteForTheProvider")} rows={3} className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10"/>
              </label>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs text-red-700">
                  <span className="font-semibold">{tBooking("cancellationPolicy2")}</span>{tBooking("paidAmountsMayBeRefundableDependingOnTheProvider")}</p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-200 p-6">
              <button type="button" onClick={() => setShowCancelModal(false)} className="h-12 flex-1 rounded-xl bg-gray-100 font-semibold text-gray-900 transition-colors hover:bg-gray-200">{tBooking("keepBooking")}</button>
              <button type="button" disabled={isPending} onClick={() => executeCancelBooking({ bookingId: booking.id, reason: cancelReason })} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-red-600 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">
                {isPending ? <Loader2 size={18} className="animate-spin"/> : tBooking("yesCancel")}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
