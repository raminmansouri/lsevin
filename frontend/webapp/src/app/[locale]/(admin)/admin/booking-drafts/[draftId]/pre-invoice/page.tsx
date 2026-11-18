import { notFound } from "next/navigation";

import { assertAdmin } from "@/lib/auth/admin-guard";
import { BookingDraftPreInvoiceView } from "@/features/booking-drafts-admin/components/booking-draft-pre-invoice";
import { getBookingDraftPreInvoice } from "@/features/booking-drafts-admin/server/pre-invoice";

export default async function BookingDraftPreInvoicePage({ params }: { params: Promise<{ locale: string; draftId: string }> }) {
  await assertAdmin("booking-drafts", "view");
  const { locale, draftId } = await params;
  const draft = await getBookingDraftPreInvoice(draftId, locale);
  if (!draft) return notFound();

  return <BookingDraftPreInvoiceView draft={draft} />;
}
