import { NextIntlClientProvider } from "next-intl";

import { getClientMessages, type MessageRoute } from "@/i18n/client-messages";

/**
 * Hands one route's subtree the app shell's messages plus that route's own
 * namespaces (ROUTE_NAMESPACES). A nested provider replaces the outer one's
 * messages rather than adding to them, so it carries the shell's set too; the
 * namespace objects are the same ones the shell passed, which React's flight
 * serializer references instead of writing twice.
 */
export async function RouteMessages({
  route,
  locale,
  children,
}: {
  route: MessageRoute;
  locale: string;
  children: React.ReactNode;
}) {
  const messages = await getClientMessages("mobileApp", locale, route);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
