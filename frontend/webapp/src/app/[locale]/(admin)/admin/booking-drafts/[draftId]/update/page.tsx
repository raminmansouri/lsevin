import { notFound } from "next/navigation";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { BookingDraftDetailCard } from "@/features/booking-drafts-admin/components/booking-draft-detail-card";
import { getBookingDraftById } from "@/features/booking-drafts-admin/server/repository";

export default async function UpdateBookingDraftPage({ params }: { params: Promise<{ locale: string; draftId: string }> }) {
  const { locale, draftId } = await params;
  const draft = await getBookingDraftById(draftId, locale);
  if (!draft) return notFound();

  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={`Booking draft ${draft.id}`} /></CardTitle></CardHeader>
      <BookingDraftDetailCard draft={draft} />
    </Card>
  );
}
