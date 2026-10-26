import { setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { resolveShareToken } from "@/features/tours/server/actions/customer/state";
import { getTourDetail } from "@/features/tours/server/platform/catalog";
import { SharedItinerary } from "@/features/tours/ui/customer/shared-itinerary";

export const metadata = { robots: { index: false, follow: false } };

/** Public, share-safe itinerary (C-109, S-047): itinerary, date and meeting point only — no names, contacts or documents. */
export default async function SharedItineraryPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const share = await resolveShareToken(token);
  if (!share || share.state !== "ok") return <SharedItinerary state="expired" />;
  const detail = await getTourDetail(share.tourId, contentLocaleFor(locale), { revealExactLocation: true }).catch(() => null);
  return (
    <SharedItinerary
      state="ok"
      expiresAt={share.expiresAt}
      title={(share.snapshot?.title as never) ?? detail?.text.title ?? null}
      meetingText={(share.snapshot?.meetingInstructions as never) ?? null}
      meeting={share.snapshot?.meeting ?? null}
      departure={share.departure}
      itinerary={detail?.itinerary ?? []}
    />
  );
}
