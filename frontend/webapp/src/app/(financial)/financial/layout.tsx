import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { getPanelUser } from "@/accounting/server/panel-auth";

import { PanelShell } from "./shell";

/**
 * The financial panel's own shell and auth gate.
 *
 * It shares the Next.js app with the customer site but nothing else: its own credentials
 * (accounting.panel_users), its own cookie, its own navigation. Nobody reaches this from
 * the admin panel, and holding an admin account grants nothing here.
 *
 * The gate is here rather than only in middleware because middleware sees the request,
 * not the database — a session that was revoked a second ago must stop working on the
 * very next page render, and only a lookup can know that.
 */
export default async function FinancialLayout({ children }: PropsWithChildren) {
  const user = await getPanelUser();
  if (!user) redirect("/financial/sign-in");

  setRequestLocale(PANEL_LOCALE);
  const messages = await getMessages({ locale: PANEL_LOCALE });

  return (
    <NextIntlClientProvider locale={PANEL_LOCALE} messages={messages}>
      <PanelShell user={user}>{children}</PanelShell>
    </NextIntlClientProvider>
  );
}
