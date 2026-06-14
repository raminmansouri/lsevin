"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "../../../design-system/dashboard-components";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Dumbbell,
  TrendingUp,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Package,
  Activity,
  Plus,
} from "lucide-react";

export default function GymOffers() {
  const t = useTranslations("ProviderDashboardOffers");

  const navigation = [
    { label: t("navigation.dashboard"), icon: <LayoutDashboard size={20} />, path: "/provider/gym/dashboard" },
    { label: t("navigation.classSchedule"), icon: <Calendar size={20} />, path: "/provider/gym/schedule" },
    { label: t("navigation.trainers"), icon: <Users size={20} />, path: "/provider/gym/trainers" },
    { label: t("navigation.memberships"), icon: <Package size={20} />, path: "/provider/gym/memberships" },
    { label: t("navigation.services"), icon: <Dumbbell size={20} />, path: "/provider/gym/services" },
    { label: t("navigation.bookings"), icon: <Calendar size={20} />, path: "/provider/gym/bookings", badge: 8 },
    { label: t("navigation.liveStatus"), icon: <Activity size={20} />, path: "/provider/gym/live-status" },
    { label: t("navigation.offers"), icon: <TrendingUp size={20} />, path: "/provider/gym/offers" },
    { label: t("navigation.analytics"), icon: <BarChart3 size={20} />, path: "/provider/gym/analytics" },
    { label: t("navigation.billing"), icon: <CreditCard size={20} />, path: "/provider/gym/billing" },
    { label: t("navigation.support"), icon: <MessageSquare size={20} />, path: "/provider/gym/support" },
    { label: t("navigation.settings"), icon: <Settings size={20} />, path: "/provider/gym/settings" },
  ];

  const offers = [
    { name: t("gym.offers.summerFitnessPackage.name"), type: t("gym.offers.summerFitnessPackage.type"), discount: "40%", start: "2026-03-01", end: "2026-05-31", status: t("status.active"), signups: 45 },
    { name: t("gym.offers.premiumMembershipDiscount.name"), type: t("gym.offers.premiumMembershipDiscount.type"), discount: "25%", start: "2026-03-10", end: "2026-04-10", status: t("status.active"), signups: 28 },
    { name: t("gym.offers.personalTrainingBundle.name"), type: t("gym.offers.personalTrainingBundle.type"), discount: "30%", start: "2026-03-01", end: "2026-03-31", status: t("status.active"), signups: 18 },
  ];

  return (
    <DashboardLayout
      navigation={navigation}
      headerTitle={t("common.headerTitle")}
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{t("gym.activePromotions")}</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          {t("common.createOffer")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{t("metrics.activeOffers")}</div>
          <div className="text-2xl font-bold text-gray-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{t("metrics.totalSignups")}</div>
          <div className="text-2xl font-bold text-green-900">91</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{t("metrics.revenueImpact")}</div>
          <div className="text-2xl font-bold text-blue-900">AED 15,240</div>
        </div>
      </div>

      <div className="space-y-4">
        {offers.map((offer, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{offer.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {offer.status}
                  </span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                    {offer.type}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>{t("details.discountLabel")} <strong className="text-orange-600">{t("details.discountOff", { discount: offer.discount })}</strong></span>
                  <span>{t("details.period", { start: offer.start, end: offer.end })}</span>
                  <span>{t("details.signupsLabel")} <strong>{offer.signups}</strong></span>
                </div>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                {t("common.editOffer")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
