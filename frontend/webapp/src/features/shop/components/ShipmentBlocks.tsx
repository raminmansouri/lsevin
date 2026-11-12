import { CalendarClock, Clock, MapPin, Phone, Store, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Fulfilment display shared by the checkout and the order page. Lsevin fulfils every order as one
 * shipment: delivery to the address, or pickup at the Lsevin office. The one overall estimate is
 * the headline. No hooks beyond next-intl, so it renders in server and client components alike.
 */

export type OfficeDetails = { address: string | null; phone: string | null; hours: string | null };

export function OverallEstimate({
  days,
  promisedAt,
  isPickup,
}: {
  days: number | null;
  /** The date stored on the order at checkout (order page); omitted at checkout. */
  promisedAt?: string | null;
  isPickup: boolean;
}) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  if (days == null && !promisedAt) return null;
  return (
    <div
      data-testid="overall-estimate"
      className="flex items-start gap-2 rounded-xl bg-[#083f30]/5 px-3 py-2.5 text-sm text-[#083f30] ring-1 ring-[#083f30]/15"
    >
      <CalendarClock size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">
          {promisedAt
            ? t(isPickup ? "fulfilment.promisedPickup" : "fulfilment.promisedDelivery", {
                date: new Date(promisedAt).toLocaleDateString(locale, { dateStyle: "medium" }),
              })
            : t(isPickup ? "fulfilment.overallPickup" : "fulfilment.overallDelivery", { days: days ?? 0 })}
        </p>
        <p className="mt-0.5 text-xs text-[#083f30]/80">{t("fulfilment.sentByLsevinHint")}</p>
      </div>
    </div>
  );
}

export function ShipmentCard({
  kind,
  title,
  meta,
  children,
  testId,
}: {
  kind: "delivery" | "office_pickup";
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
  testId?: string;
}) {
  const Icon = kind === "office_pickup" ? Store : Truck;
  return (
    <div data-testid={testId} data-shipment={kind} className="rounded-xl border border-neutral-200 p-3">
      <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
        <Icon size={15} className="shrink-0 text-[#083f30]" aria-hidden />
        <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
      </p>
      {meta ? <div className="mt-1 text-xs text-neutral-600">{meta}</div> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

/** The Lsevin office's address, phone (tap to call) and opening hours, as set in admin. */
export function OfficeDetailsView({ office }: { office: OfficeDetails | null }) {
  const t = useTranslations("Shop");
  if (!office || (!office.address && !office.phone && !office.hours)) {
    return <p className="text-xs text-neutral-500">{t("fulfilment.officeNotSet")}</p>;
  }
  const phone = office.phone?.replace(/[^\d+]/g, "") ?? "";
  return (
    <div className="space-y-1.5 text-xs text-neutral-700" data-testid="office-details">
      {office.address ? (
        <p className="flex items-start gap-1.5">
          <MapPin size={13} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden />
          <span className="[overflow-wrap:anywhere]">{office.address}</span>
        </p>
      ) : null}
      {phone ? (
        <p className="flex items-center gap-1.5">
          <Phone size={13} className="shrink-0 text-neutral-500" aria-hidden />
          <a href={`tel:${phone}`} className="font-semibold text-[#083f30] underline-offset-2 hover:underline" dir="ltr">
            {office.phone}
          </a>
          <span className="sr-only">{t("fulfilment.call")}</span>
        </p>
      ) : null}
      {office.hours ? (
        <p className="flex items-start gap-1.5">
          <Clock size={13} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden />
          <span>
            <span className="text-neutral-500">{t("fulfilment.openingHours")}: </span>
            {office.hours}
          </span>
        </p>
      ) : null}
    </div>
  );
}
