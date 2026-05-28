import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderOffers,
  listProviderServices,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  providerServiceOptions,
  toDateTimeLocal,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function EditProviderOfferPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; offerId: string }>;
}) {
  const { locale, providerId, offerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [offers, services] = await Promise.all([
    listProviderOffers(userId, providerId, locale),
    listProviderServices(userId, providerId, locale),
  ]);
  const offer = offers.find((item) => String(item.id) === offerId);
  if (!offer) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "offerId", type: "hidden" as const },
    {
      name: "providerServiceId",
      label: "Service",
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    { name: "title", label: "Title", type: "text" as const, required: true },
    { name: "subtitle", label: "Subtitle", type: "text" as const },
    {
      name: "discountPercent",
      label: "Discount percent",
      type: "number" as const,
      step: "0.01",
      min: 0,
      max: 100,
    },
    {
      name: "validUntil",
      label: "Valid until",
      type: "datetime-local" as const,
      required: true,
    },
    { name: "code", label: "Coupon code", type: "text" as const },
    {
      name: "usageLimit",
      label: "Usage limit",
      type: "number" as const,
      min: 0,
    },
    {
      name: "descriptionEn",
      label: "Description English",
      type: "textarea" as const,
      rows: 4,
    },
    {
      name: "descriptionFa",
      label: "Description Persian",
      type: "textarea" as const,
      rows: 4,
    },
    { name: "isActive", label: "Active", type: "checkbox" as const },
    { name: "isFeatured", label: "Featured", type: "checkbox" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveOffer"
      title="Edit offer"
      description="Update this service offer."
      fields={fields}
      initialValues={{
        providerId,
        offerId: offer.id,
        providerServiceId: offer.providerServiceId,
        title: offer.title,
        subtitle: offer.subtitle || "",
        discountPercent: offer.discountPercent,
        validUntil: toDateTimeLocal(offer.validUntil),
        code: offer.code || "",
        isActive: offer.isActive,
        isFeatured: offer.isFeatured,
        usageLimit: offer.usageLimit || "",
        descriptionEn: "",
        descriptionFa: "",
      }}
      backHref={providerPortalBack(providerId, "/offers")}
      submitLabel="Save offer"
      successMessage="Offer updated."
    />
  );
}
