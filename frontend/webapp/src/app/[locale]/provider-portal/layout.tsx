import { NextIntlClientProvider } from "next-intl";

import { getClientMessages } from "@/i18n/client-messages";

/**
 * This layout exists only to scope translations. It adds no markup.
 * The root layout ships the core namespaces alone, so without a provider here
 * this tree would render `MISSING_MESSAGE` — see @/i18n/client-messages.
 */
export default async function ProviderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getClientMessages("providerPortal");

  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  );
}
