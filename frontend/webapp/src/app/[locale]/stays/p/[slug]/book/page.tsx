import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { parseStaySearch } from "@/features/stays/domain/search";
import { getPropertyDetail, getRoomOffers } from "@/features/stays/server/catalog";
import { StayBookingFlow, type BookingContext } from "@/features/stays/ui/booking/booking-flow";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function StayBookPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const raw = await searchParams;
  const search = parseStaySearch(raw);
  const roomId = one(raw.room);
  const planId = one(raw.plan);
  const property = await getPropertyDetail({ slug }, content);
  if (!property) notFound();
  const t = await getTranslations({ locale, namespace: "StayApp" });
  const occupancy = { rooms: search.rooms, adults: Math.max(search.adults, search.rooms), childAges: search.childAges };
  const offers = search.checkIn && search.checkOut ? await getRoomOffers(property.id, { checkIn: search.checkIn, checkOut: search.checkOut, occupancy }, content) : null;
  const room = offers?.rooms.find((r) => r.roomTypeId === roomId);
  const plan = room?.plans.find((p) => p.ratePlanId === planId);
  const backHref = `/stays/${slug}${search.checkIn ? `?in=${search.checkIn}&out=${search.checkOut}&adults=${search.adults}&rooms=${search.rooms}${search.childAges.length ? `&ages=${search.childAges.join(",")}` : ""}` : ""}`;

  if (!room || !plan || !plan.quote || plan.unavailableReason || offers?.dateError || !property.policy) {
    const reason = offers?.dateError ?? plan?.unavailableReason ?? (room && plan ? "sold_out" : null);
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center" data-testid="stay-book-unavailable">
        <h1 className="text-xl font-bold">{t("detail.roomsAvailableNone")}</h1>
        {reason ? <p className="mt-2 text-sm text-slate-600">{t.has(`detail.room.unavailable.${reason}` as never) ? t(`detail.room.unavailable.${reason}` as never) : t(`errors.${reason}` as never)}</p> : null}
        <Link href={backHref} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
          {t("book.restart")}
        </Link>
      </div>
    );
  }

  const r = property.rules;
  const houseRules = [
    r.pets ? t("detail.rules.pets") : t("detail.rules.noPets"),
    r.smoking ? t("detail.rules.smoking") : t("detail.rules.noSmoking"),
    r.parties ? t("detail.rules.parties") : t("detail.rules.noParties"),
    ...(r.familiesOnly ? [t("detail.rules.familiesOnly")] : []),
    ...(r.idRequired ? [t("detail.rules.idRequired")] : []),
  ];
  const ctx: BookingContext = {
    propertyId: property.id,
    propertySlug: property.slug,
    propertyName: property.name?.value ?? slug,
    roomTypeId: room.roomTypeId,
    roomName: room.name,
    ratePlanId: plan.ratePlanId,
    mealPlan: plan.mealPlan,
    refundable: plan.refundable,
    checkIn: search.checkIn!,
    checkOut: search.checkOut!,
    occupancy,
    confirmationMode: property.confirmationMode,
    requestTimeoutHours: property.requestTimeoutHours,
    timezone: property.timezone,
    coverUrl: property.media[0]?.url ?? null,
    policy: { version: property.policy.version, rules: plan.refundable ? property.policy.rules : [], noShowRefundPercent: property.policy.noShowRefundPercent, text: property.policy.text?.value ?? null },
    houseRules,
  };
  const actor = await currentActor();
  return <StayBookingFlow ctx={ctx} signedIn={Boolean(actor.userId)} initialQuote={plan.quote} />;
}
