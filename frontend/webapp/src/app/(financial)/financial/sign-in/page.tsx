import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { getPanelUser } from "@/accounting/server/panel-auth";

import { SignInForm } from "./form";

export default async function FinancialSignInPage() {
  // Already signed in — no reason to show the form again.
  if (await getPanelUser()) redirect("/financial");

  setRequestLocale(PANEL_LOCALE);
  const [t, messages] = await Promise.all([
    getTranslations("Admin.accounting"),
    getMessages({ locale: PANEL_LOCALE }),
  ]);

  return (
    <NextIntlClientProvider locale={PANEL_LOCALE} messages={messages}>
      <div dir="rtl" lang="fa" className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <div className="bg-card w-full max-w-sm rounded-lg border p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold">{t("panelName")}</h1>
          <p className="text-muted-foreground mb-5 text-xs">{t("signInHint")}</p>
          <SignInForm
            labels={{
              username: t("username"),
              password: t("password"),
              submit: t("signIn"),
              invalid: t("signInInvalid"),
              locked: t("signInLocked"),
              inactive: t("signInInactive"),
              missing: t("signInMissing"),
            }}
          />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
