import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listBilling } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewPayoutAccountPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "payoutAccountId", type: "hidden" as const },
    { name: "accountHolderName", label: "Account holder name", type: "text" as const, required: true, fullWidth: true },
    { name: "bankName", label: "Bank name", type: "text" as const },
    { name: "iban", label: "IBAN", type: "text" as const },
    { name: "swiftCode", label: "SWIFT code", type: "text" as const },
    { name: "accountNumberLast4", label: "Account last 4 digits", type: "text" as const },
    { name: "country", label: "Country", type: "text" as const },
    { name: "currencyCode", label: "Currency code", type: "text" as const, required: true },
    { name: "isDefault", label: "Default payout account", type: "checkbox" as const },
  ];

  return <ProviderRecordForm operation="savePayoutAccount" title="Add payout account" description="Add a payout account for this provider. Activation remains under platform control if needed." fields={fields} initialValues={{ providerId, currencyCode: "USD", isDefault: false }} backHref={providerPortalBack(providerId, "/billing/payout-accounts")} submitLabel="Save payout account" successMessage="Payout account saved." />;
}
