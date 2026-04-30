import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderOffers, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, providerServiceOptions, toDateTimeLocal } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewProviderOfferPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const services = await listProviderServices(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "offerId", type: "hidden" as const },
    { name: "providerServiceId", label: "Service", type: "select" as const, required: true, options: providerServiceOptions(services), fullWidth: true },
    { name: "title", label: "Title", type: "text" as const, required: true },
    { name: "subtitle", label: "Subtitle", type: "text" as const },
    { name: "discountPercent", label: "Discount percent", type: "number" as const, step: "0.01", min: 0, max: 100 },
    { name: "validUntil", label: "Valid until", type: "datetime-local" as const, required: true },
    { name: "code", label: "Coupon code", type: "text" as const },
    { name: "usageLimit", label: "Usage limit", type: "number" as const, min: 0 },
    { name: "descriptionEn", label: "Description English", type: "textarea" as const, rows: 4 },
    { name: "descriptionFa", label: "Description Persian", type: "textarea" as const, rows: 4 },
    { name: "isActive", label: "Active", type: "checkbox" as const },
    { name: "isFeatured", label: "Featured", type: "checkbox" as const },
  ];

  return <ProviderRecordForm operation="saveOffer" title="Add offer" description="Create a discount offer for one of your services." fields={fields} initialValues={{ providerId, providerServiceId: services[0]?.id || "", discountPercent: 0, isActive: true, isFeatured: false }} backHref={providerPortalBack(providerId, "/offers")} submitLabel="Create offer" successMessage="Offer created." />;
}
