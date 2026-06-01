import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "ProviderPortal" });
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
      label: t("offerForm.service"),
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    { name: "title", label: t("offerForm.title"), type: "text" as const, required: true },
    { name: "subtitle", label: t("offerForm.subtitle"), type: "text" as const },
    {
      name: "discountPercent",
      label: t("offerForm.discountPercent"),
      type: "number" as const,
      step: "0.01",
      min: 0,
      max: 100,
    },
    {
      name: "validUntil",
      label: t("offerForm.validUntil"),
      type: "datetime-local" as const,
      required: true,
    },
    { name: "code", label: t("offerForm.couponCode"), type: "text" as const },
    {
      name: "usageLimit",
      label: t("offerForm.usageLimit"),
      type: "number" as const,
      min: 0,
    },
    {
      name: "descriptionEn",
      label: t("offerForm.descriptionEn"),
      type: "textarea" as const,
      rows: 4,
    },
    {
      name: "descriptionFa",
      label: t("offerForm.descriptionFa"),
      type: "textarea" as const,
      rows: 4,
    },
    { name: "isActive", label: t("status.active"), type: "checkbox" as const },
    { name: "isFeatured", label: t("status.featured"), type: "checkbox" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveOffer"
      title={t("offerForm.editTitle")}
      description={t("offerForm.updateDescription")}
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
      submitLabel={t("offerForm.saveOffer")}
      successMessage={t("offersManager.offerUpdated")}
    />
  );
}
