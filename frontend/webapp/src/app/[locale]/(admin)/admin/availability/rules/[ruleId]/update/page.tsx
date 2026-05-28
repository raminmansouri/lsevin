import { notFound } from "next/navigation";

import { AvailabilityRuleForm } from "@/features/booking-pro/admin/components/availability-rule-form";
import { getGenericAvailabilityRuleById } from "@/features/booking-pro/server/generic-availability-admin.repository";

type Props = {
  params: Promise<{ locale: string; ruleId: string }> | { locale: string; ruleId: string };
};

export default async function UpdateAvailabilityRulePage({ params }: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "fa-IR";
  const rule = await getGenericAvailabilityRuleById(resolvedParams.ruleId, locale);
  if (!rule) notFound();
  return <AvailabilityRuleForm locale={locale} rule={rule} />;
}
