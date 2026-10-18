import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import sql from "@/config/database/db";
import { getProfileForEdit } from "@/features/profile/actions/profile.actions";
import { ProfileOverview } from "@/features/profile/components/profile-overview";
import type { ProfileOverviewData } from "@/features/profile/components/profile-overview-view";
import { getSession } from "@/lib/auth/session";

import { getCustomerStatsByIdentityUser } from "./components/customer-stats";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "MobileProfile.main" });
  const tConsultation = await getTranslations({
    locale,
    namespace: "Consultation",
  });
  const tStats = await getTranslations({
    locale,
    namespace: "MobileProfile.stats",
  });
  const tUser = await getTranslations({ locale, namespace: "User.Profile" });
  const tCommon = await getTranslations({
    locale,
    namespace: "MobileProfile.common",
  });
  const profile = await getProfileForEdit();
  const menu = [
    {
      icon: "Wallet" as const,
      label: t("menu.walletPayments"),
      href: "/n/app/mobile/profile/wallet",
      color: "text-green-600",
    },
    {
      icon: "Gift" as const,
      label: t("menu.rewardsLoyalty"),
      href: "/n/app/mobile/profile/rewards",
      color: "text-orange-600",
    },
    {
      icon: "Share2" as const,
      label: t("menu.shareWithFriends"),
      href: "/n/app/mobile/profile/share",
      color: "text-blue-600",
    },
    {
      icon: "Heart" as const,
      label: t("menu.savedFavorites"),
      href: "/n/app/mobile/profile/favorites",
      color: "text-red-600",
    },
    {
      icon: "HeartPulse" as const,
      label: t("menu.myHealthRecord"),
      href: "/n/app/mobile/profile/my-health-record",
      color: "text-blue-600",
    },
    {
      icon: "ClipboardList" as const,
      label: t("menu.myCases"),
      href: "/n/app/mobile/profile/my-cases",
      color: "text-blue-600",
    },
    {
      icon: "Link2" as const,
      label: t("menu.mySharing"),
      href: "/n/app/mobile/profile/my-sharing",
      color: "text-blue-600",
    },
    {
      icon: "Stamp" as const,
      label: t("menu.myPassport"),
      href: "/n/app/mobile/profile/my-passport",
      color: "text-blue-600",
    },
    {
      icon: "FlaskConical" as const,
      label: t("menu.myResults"),
      href: "/n/app/mobile/profile/my-results",
      color: "text-blue-600",
    },
    {
      icon: "MessageCircle" as const,
      label: tConsultation("admin.title"),
      href: "/n/app/mobile/profile/consultations",
      color: "text-teal-600",
    },
    // Medical profile is deactivated. The route itself 404s as well, so removing it here
    // is the visible half of that — leaving the row would hand every visitor a dead link.
    // Re-enable by restoring this line and the page body in medical-profile/page.tsx.
    // { icon: "FileText" as const, label: t('menu.medicalProfile'), href: '/n/app/mobile/profile/medical-profile', color: 'text-blue-600' },
    {
      icon: "Bell" as const,
      label: t("menu.notifications"),
      href: "/n/app/mobile/notifications",
      color: "text-purple-600",
    },
    // { icon: "Globe" as const, label: 'Language & Currency', href: '/n/app/mobile/profile/settings', color: 'text-teal-600' },
    {
      icon: "Shield" as const,
      label: t("menu.privacySecurity"),
      href: "/n/app/mobile/profile/privacy-security",
      color: "text-indigo-600",
    },
    {
      icon: "ScrollText" as const,
      label: t("menu.privacyPolicy"),
      href: "/n/app/mobile/profile/privacy-policy",
      color: "text-slate-600",
    },
  ];

  const session = await getSession();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);
  const stats = await getCustomerStatsByIdentityUser(sql, session.user.id);
  const data: ProfileOverviewData = {
    version: 1,
    locale,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    image: profile.profileImageUrl || "",
    editLabel: tUser("edit.title"),
    signOutLabel: tCommon("logOut"),
    menu,
    stats: [
      {
        label: tStats("bookings"),
        value: new Intl.NumberFormat(locale).format(stats.bookingsCount),
        icon: "CalendarCheck2",
        href: "/n/app/mobile/bookings",
      },
      {
        label: tStats("points"),
        value: new Intl.NumberFormat(locale).format(stats.pointsBalance),
        icon: "Coins",
      },
      {
        label: tStats("saved"),
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency: stats.currencyCode,
          maximumFractionDigits: stats.savedAmount % 1 === 0 ? 0 : 2,
        }).format(stats.savedAmount),
        icon: "PiggyBank",
      },
    ],
  };
  return <ProfileOverview data={data} />;
}
