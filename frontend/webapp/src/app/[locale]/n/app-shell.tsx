import { NextIntlClientProvider } from "next-intl";

import MobileAppBar from "@/components/mobile-app-bar";
import Shell from "@/components/shell";
import LocaleSwitcher from "@/components/locale/locale-switcher";
import { AssistantLauncher } from "@/features/assistant/components/assistant-launcher";
import NotificationsBar from "@/features/shared/components/Notifications/notifications-bar";
import { getFooterPages } from "@/features/site-content/server/repository";
import { DesktopFooter } from "@/features/web-desktop/components/DesktopFooter";
import { DesktopHeader } from "@/features/web-desktop/components/DesktopHeader";
import { getClientMessages } from "@/i18n/client-messages";

import { AppChrome } from "./app-chrome";

/**
 * The customer app chrome (mobile app bar + tabs, desktop header + footer).
 * Shared by the /n tree and the public site pages (/about-us, /terms-conditions, ...)
 * so both look like one site.
 */
export async function AppShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  // The mobile app's own translation set. The root layout only provides the core
  // namespaces, so this provider carries the full list this tree needs — nothing
  // from the admin or provider-portal catalogs comes down to a customer's phone.
  // Explicit `locale` — see getClientMessages: without it, static generation of
  // /tr, /en, … bakes the default locale's copy of the bottom nav / greetings
  // onto every page in this tree.
  const messages = await getClientMessages("mobileApp", locale);
  // Editorial pages flagged for the footer (admin → Editorial).
  const footerPages = await getFooterPages(locale);

  // Shell's default page padding would float the app bar away from the top edge,
  // which is the giveaway that you are looking at a website. The app tree owns its
  // own spacing instead.
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Shell className="gap-0 py-0">
        {/* No gap: the app bar and each page's own header must meet without a seam. */}
        <div className="flex flex-col">
          <AppChrome
            appBar={<MobileAppBar />}
            desktopHeader={
              <DesktopHeader
                actions={
                  <>
                    <NotificationsBar variant="glass" />
                    <LocaleSwitcher variant="glass" />
                  </>
                }
              />
            }
            desktopFooter={<DesktopFooter pages={footerPages} />}
          >
            {children}
          </AppChrome>
        </div>
      </Shell>
      <AssistantLauncher />
    </NextIntlClientProvider>
  );
}
