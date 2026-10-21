import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCustomerState } from "@/features/tours/server/actions/customer/state";
import { currentActor } from "@/features/tours/server/platform/access";
import { ProfileView } from "@/features/tours/ui/customer/profile-view";
import { redirect } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.profile" });
  return { title: t("title"), robots: { index: false } };
}

/** Tours profile: display settings, notification channels, privacy and data controls (C-005, C-107, C-110). */
export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  if (!actor.userId) redirect({ href: `/sign-in?redirectTo=${encodeURIComponent("/tours/profile")}`, locale });
  const state = await getCustomerState(actor.userId!);
  return (
    <ProfileView
      state={{
        notificationChannels: state?.notificationChannels ?? { in_app: true, email: true, sms: false, push: true },
        marketingOptIn: state?.marketingOptIn ?? false,
        personalizationOptIn: state?.personalizationOptIn ?? false,
        historyOptIn: state?.historyOptIn ?? true,
      }}
    />
  );
}
