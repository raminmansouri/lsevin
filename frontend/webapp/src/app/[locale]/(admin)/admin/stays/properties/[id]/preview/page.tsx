import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { DEFAULT_SEARCH } from "@/features/stays/domain/search";
import { getPropertyDetail, getRoomOffers, listReviews } from "@/features/stays/server/catalog";
import { PropertyView } from "@/features/stays/ui/detail/property-view";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { ToursPrefsProvider } from "@/features/tours/ui/customer/prefs-context";

/** Admin preview: the real customer page for any status (drafts included), with booking switched off. */
export default async function StaysAdminPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPageActor();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const locale = await getLocale();
  const content = contentLocaleFor(locale);
  const property = await getPropertyDetail({ id }, content, { mode: "preview", revealExactLocation: true });
  if (!property) notFound();
  const occupancy = { rooms: 1, adults: 2, childAges: [] as number[] };
  const [offers, reviews] = await Promise.all([getRoomOffers(property.id, { checkIn: null, checkOut: null, occupancy }, content), listReviews(property.id)]);
  return (
    <ToursPrefsProvider initial={{ calendar: locale === "fa" ? "persian" : "gregory", currency: null, currencies: [], signedIn: false, userName: null }}>
      <div className="overflow-hidden rounded-lg border bg-slate-50" data-testid="stays-admin-preview-page">
        <PropertyView property={property} rooms={offers.rooms} reviews={reviews} search={DEFAULT_SEARCH} dateError={null} saved={false} cities={[]} preview />
      </div>
    </ToursPrefsProvider>
  );
}
