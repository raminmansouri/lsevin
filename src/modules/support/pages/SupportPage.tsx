import { requireCurrentUser } from "@core/auth/session";
import { getPortalLocale } from "@core/i18n/server";
import { PageHeader } from "@core/ui/PageHeader";
import { TicketsList } from "../components/SupportManager";
import { listMyProviderTickets } from "../repository";

export async function SupportPage() {
  const user = await requireCurrentUser();
  const [tickets, locale] = await Promise.all([listMyProviderTickets(user.id), getPortalLocale()]);
  return <div><PageHeader title="Support" description="Support tickets across all providers assigned to your LSevin account." /><TicketsList tickets={tickets} locale={locale.header} timeZone={locale.locale === "fa" ? "Asia/Tehran" : "UTC"} /></div>;
}
