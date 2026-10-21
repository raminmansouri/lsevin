import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { defaultCalendarForLocale } from "@/features/tours/domain/calendar";
import { resolvePrefs, listDisplayCurrencies } from "@/features/tours/server/actions/customer/state";
import { currentActor } from "@/features/tours/server/platform/access";
import { ToursPrefsProvider } from "@/features/tours/ui/customer/prefs-context";
import { ToursShell } from "@/features/tours/ui/customer/shell/tours-shell";
import { getClientMessages } from "@/i18n/client-messages";
import { getSession } from "@/lib/auth/session";

// Every Tours page depends on the visitor (session, guest cookie, preferences).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.meta" });
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description") };
}

export default async function ToursLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getClientMessages("tours", locale);
  const actor = await currentActor();
  const session = actor.userId ? await getSession().catch(() => null) : null;
  // Preferences/currencies are conveniences: a failed read falls back to defaults
  // instead of taking the whole Tours app down.
  const [prefs, currencies] = await Promise.all([
    resolvePrefs(actor, locale).catch(() => ({ calendar: defaultCalendarForLocale(locale), currency: null, calendarIsDefault: true })),
    listDisplayCurrencies().catch(() => [] as string[]),
  ]);
  const user = session?.user as { firstName?: string; lastName?: string } | undefined;
  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null : null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToursPrefsProvider
        initial={{ calendar: prefs.calendar, currency: prefs.currency, currencies, signedIn: Boolean(actor.userId), userName }}
      >
        <ToursShell>{children}</ToursShell>
      </ToursPrefsProvider>
    </NextIntlClientProvider>
  );
}
