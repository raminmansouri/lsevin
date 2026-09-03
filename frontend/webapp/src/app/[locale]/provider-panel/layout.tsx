import { NextIntlClientProvider } from "next-intl";

import { getClientMessages } from "@/i18n/client-messages";

// This whole segment renders per request (session-gated dashboards / forms /
// marketing pages that read the DB). The dynamic floor that used to sit on
// `[locale]/layout.tsx` now lives here.
export const dynamic = "force-dynamic";


/**
 * This layout exists only to scope translations. It adds no markup.
 * The root layout ships the core namespaces alone, so without a provider here
 * this tree would render `MISSING_MESSAGE` — see @/i18n/client-messages.
 */
export default async function ProviderPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getClientMessages("providerPanel");

  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  );
}
