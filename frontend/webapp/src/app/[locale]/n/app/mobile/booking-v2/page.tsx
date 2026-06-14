import { BookingWizard } from "@/features/booking-v2/components/BookingWizard";

export default async function BookingV2Page({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = await params;

  const providerId = typeof resolvedSearchParams.providerId === "string" ? resolvedSearchParams.providerId : null;
  const serviceId = typeof resolvedSearchParams.serviceId === "string" ? resolvedSearchParams.serviceId : null;
  const specialistId = typeof resolvedSearchParams.specialistId === "string" ? resolvedSearchParams.specialistId : null;

  return (
    <BookingWizard
      initialProviderId={providerId}
      initialServiceId={serviceId}
      initialSpecialistId={specialistId}
      locale={resolvedParams.locale}
    />
  );
}
