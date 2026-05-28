import { BookableResourceForm } from "@/features/booking-pro/admin/components/bookable-resource-form";
import type { BookableResource } from "@/features/booking-pro/server/generic-availability-admin.repository";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddBookableResourcePage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "fa-IR";
  const providerId = one(resolvedSearch?.providerId) || "";
  const providerServiceId = one(resolvedSearch?.providerServiceId) || null;

  const resource: BookableResource = {
    serviceProviderId: providerId,
    providerServiceId,
    resourceType: "room",
    code: "",
    nameTranslations: { "fa-IR": "", "en-US": "", "tr-TR": "", "ar-SA": "" },
    descriptionTranslations: {},
    totalCapacity: 1,
    isActive: true,
    metadata: {},
  };

  return <BookableResourceForm locale={locale} resource={resource} />;
}
