// FileText went with the deactivated medical-profile row below; restore it there too.
import {
  Bell,
  ClipboardList,
  FlaskConical,
  Gift,
  Globe,
  Heart,
  HeartPulse,
  Link2,
  LogOut,
  MessageCircle,
  ScrollText,
  Settings,
  Share2,
  Shield,
  Stamp,
  Wallet as WalletIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import { getProfileForEdit } from "@/features/profile/actions/profile.actions";
import FetchDisplayProfileInfo from "@/features/profile/components/fetch-display-profile-info";
import { useNavigate } from "@/hooks/use-navigate";
import { getSession } from "@/lib/auth/session";

import { CustomerStats } from "./components/customer-stats";
import SignOutButton from "./components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const locale = await getLocale();
  const dataLocale = locale === "fa" ? "fa-IR" : "en-US";
  const t = await getTranslations({ locale, namespace: "MobileProfile.main" });
  const tConsultation = await getTranslations({
    locale,
    namespace: "Consultation",
  });
  const profile = await getProfileForEdit(dataLocale);

  const menuItems = [
    {
      icon: WalletIcon,
      label: t("menu.walletPayments"),
      path: "/n/app/mobile/profile/wallet",
      color: "text-green-600",
    },
    {
      icon: Gift,
      label: t("menu.rewardsLoyalty"),
      path: "/n/app/mobile/profile/rewards",
      color: "text-orange-600",
    },
    {
      icon: Share2,
      label: t("menu.shareWithFriends"),
      path: "/n/app/mobile/profile/share",
      color: "text-blue-600",
    },
    {
      icon: Heart,
      label: t("menu.savedFavorites"),
      path: "/n/app/mobile/profile/favorites",
      color: "text-red-600",
    },
    {
      icon: HeartPulse,
      label: t("menu.myHealthRecord"),
      path: "/n/app/mobile/profile/my-health-record",
      color: "text-blue-600",
    },
    {
      icon: ClipboardList,
      label: t("menu.myCases"),
      path: "/n/app/mobile/profile/my-cases",
      color: "text-blue-600",
    },
    {
      icon: Link2,
      label: t("menu.mySharing"),
      path: "/n/app/mobile/profile/my-sharing",
      color: "text-blue-600",
    },
    {
      icon: Stamp,
      label: t("menu.myPassport"),
      path: "/n/app/mobile/profile/my-passport",
      color: "text-blue-600",
    },
    {
      icon: FlaskConical,
      label: t("menu.myResults"),
      path: "/n/app/mobile/profile/my-results",
      color: "text-blue-600",
    },
    {
      icon: MessageCircle,
      label: tConsultation("admin.title"),
      path: "/n/app/mobile/profile/consultations",
      color: "text-teal-600",
    },
    // Medical profile is deactivated. The route itself 404s as well, so removing it here
    // is the visible half of that — leaving the row would hand every visitor a dead link.
    // Re-enable by restoring this line and the page body in medical-profile/page.tsx.
    // { icon: FileText, label: t('menu.medicalProfile'), path: '/n/app/mobile/profile/medical-profile', color: 'text-blue-600' },
    {
      icon: Bell,
      label: t("menu.notifications"),
      path: "/n/app/mobile/notifications",
      color: "text-purple-600",
    },
    // { icon: Globe, label: 'Language & Currency', path: '/n/app/mobile/profile/settings', color: 'text-teal-600' },
    {
      icon: Shield,
      label: t("menu.privacySecurity"),
      path: "/n/app/mobile/profile/privacy-security",
      color: "text-indigo-600",
    },
    {
      icon: ScrollText,
      label: t("menu.privacyPolicy"),
      path: "/n/app/mobile/profile/privacy-policy",
      color: "text-slate-600",
    },
  ];

  const session = await getSession();
  const identityUserId = session?.user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <FetchDisplayProfileInfo profile={profile}></FetchDisplayProfileInfo>

        {/* Stats */}
        <CustomerStats identityUserId={identityUserId} locale={locale} />

        {/*  <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">12</div>
            <div className="text-xs text-gray-500">{t("bookings")}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">2,450</div>
            <div className="text-xs text-gray-500">{t("points")}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">$850</div>
            <div className="text-xs text-gray-500">{t("saved")}</div>
          </div>
        </div> */}
      </div>

      {/* Menu Items */}
      <div className="space-y-2 p-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              // onClick={() => navigate(item.path)}
              href={item.path}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 transition hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 ${item.color}`}
              >
                <Icon size={20} />
              </div>
              <span className="flex-1 text-left font-medium text-gray-900">
                {item.label}
              </span>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          );
        })}

        {/* Logout */}
        <SignOutButton />
      </div>
    </div>
  );
}
