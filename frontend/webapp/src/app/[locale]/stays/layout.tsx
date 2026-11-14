import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StaysShell } from "@/features/stays/ui/shell/stays-shell";
import { defaultCalendarForLocale } from "@/features/tours/domain/calendar";
import { listDisplayCurrencies, resolvePrefs } from "@/features/tours/server/actions/customer/state";
import { currentActor } from "@/features/tours/server/platform/access";
import { ToursPrefsProvider } from "@/features/tours/ui/customer/prefs-context";
import { getClientMessages } from "@/i18n/client-messages";
import { getSession } from "@/lib/auth/session";

// Every stays page depends on the visitor (session, preferences, guest cookie).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description") };
}

/**
 * Stays (hotels / اقامتگاه) sub-application. Display preferences (calendar,
 * approximate-price currency) are the same account-wide preferences the Tours
 * app uses, so a visitor sets them once.
 */
export default async function StaysLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getClientMessages("stays", locale);
  const actor = await currentActor();
  const session = actor.userId ? await getSession().catch(() => null) : null;
  const [prefs, currencies] = await Promise.all([
    resolvePrefs(actor, locale).catch(() => ({ calendar: defaultCalendarForLocale(locale), currency: null, calendarIsDefault: true })),
    listDisplayCurrencies().catch(() => [] as string[]),
  ]);
  const user = session?.user as { firstName?: string; lastName?: string } | undefined;
  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null : null;
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToursPrefsProvider initial={{ calendar: prefs.calendar, currency: prefs.currency, currencies, signedIn: Boolean(actor.userId), userName }}>
        <StaysShell>{children}</StaysShell>
      </ToursPrefsProvider>
    </NextIntlClientProvider>
  );
}
