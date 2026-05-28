import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listBilling,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditPayoutAccountPage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    payoutAccountId: string;
  }>;
}) {
  const { locale, providerId, payoutAccountId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const billing = await listBilling(userId, providerId);
  const account = billing.payoutAccounts.find(
    (item) => item.id === payoutAccountId,
  );
  if (!account) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "payoutAccountId", type: "hidden" as const },
    {
      name: "accountHolderName",
      label: "Account holder name",
      type: "text" as const,
      required: true,
      fullWidth: true,
    },
    { name: "bankName", label: "Bank name", type: "text" as const },
    { name: "iban", label: "IBAN", type: "text" as const },
    { name: "swiftCode", label: "SWIFT code", type: "text" as const },
    {
      name: "accountNumberLast4",
      label: "Account last 4 digits",
      type: "text" as const,
    },
    { name: "country", label: "Country", type: "text" as const },
    {
      name: "currencyCode",
      label: "Currency code",
      type: "text" as const,
      required: true,
    },
    {
      name: "isDefault",
      label: "Default payout account",
      type: "checkbox" as const,
    },
  ];

  return (
    <ProviderRecordForm
      operation="savePayoutAccount"
      title="Edit payout account"
      description="Update this payout account."
      fields={fields}
      initialValues={{
        providerId,
        payoutAccountId: account.id,
        accountHolderName: account.accountHolderName,
        bankName: account.bankName || "",
        iban: account.iban || "",
        swiftCode: account.swiftCode || "",
        accountNumberLast4: account.accountNumberLast4 || "",
        country: account.country || "",
        currencyCode: account.currencyCode,
        isDefault: account.isDefault,
      }}
      backHref={providerPortalBack(providerId, "/billing/payout-accounts")}
      submitLabel="Save payout account"
      successMessage="Payout account updated."
    />
  );
}
