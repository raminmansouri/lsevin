import { AvailabilityRuleForm } from "@/features/booking-pro/admin/components/availability-rule-form";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddAvailabilityRulePage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "fa-IR";

  return (
    <AvailabilityRuleForm
      locale={locale}
      defaultTargetType={one(resolvedSearch?.targetType)}
      defaultTargetId={one(resolvedSearch?.targetId)}
      defaultProviderServiceId={one(resolvedSearch?.providerServiceId)}
    />
  );
}
