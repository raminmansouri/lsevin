"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, Gift, TicketPercent, UserPlus, Users } from "lucide-react";

import type { ReferralAdminDashboardData } from "./types";

interface ReferralAdminDashboardClientProps {
  initialData: ReferralAdminDashboardData;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReferralAdminDashboardClient({
  initialData,
}: ReferralAdminDashboardClientProps) {
  const t = useTranslations("AdminGenerated");
  const locale = useLocale();
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("referralProgramAdmin")}</h1>
            <p className="text-gray-600 mt-1">
              {t("activeProgramLabel", { name: initialData.program.name, code: initialData.program.code })}
            </p>
          </div>

          <Link
            href="/admin/referrals/policies"
            className="inline-flex items-center justify-center rounded-xl bg-[#083f30] px-4 py-2.5 text-white font-semibold hover:bg-[#0a5a44] transition-colors"
          >
            {t("managePolicy")}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              title: t("activeCodes"),
              value: initialData.summary.activeCodes,
              icon: Gift,
            },
            {
              title: t("invitations"),
              value: initialData.summary.invitations,
              icon: UserPlus,
            },
            {
              title: t("registrations"),
              value: initialData.summary.registrations,
              icon: Users,
            },
            {
              title: t("profileCompletions"),
              value: initialData.summary.profileCompletions,
              icon: BarChart3,
            },
            {
              title: t("couponsIssued"),
              value: initialData.summary.couponsIssued,
              icon: TicketPercent,
            },
            {
              title: t("couponsRedeemed"),
              value: initialData.summary.couponsRedeemed,
              icon: TicketPercent,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{item.title}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{item.value}</div>
                  </div>
                  <div className="rounded-xl bg-[#083f30]/10 p-3">
                    <Icon className="h-5 w-5 text-[#083f30]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t("recentInvitations")}</h2>
              <span className="text-sm text-gray-500">{t("shownCount", { count: initialData.invitations.length })}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-3 pr-4 font-medium">{t("referrer")}</th>
                    <th className="py-3 pr-4 font-medium">{t("referee")}</th>
                    <th className="py-3 pr-4 font-medium">{t("status")}</th>
                    <th className="py-3 font-medium">{t("invited")}</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData.invitations.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{row.referrer}</td>
                      <td className="py-3 pr-4 text-gray-700">{row.referee}</td>
                      <td className="py-3 pr-4 text-gray-700">{row.status}</td>
                      <td className="py-3 text-gray-700">{formatDate(row.invitedAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t("recentCoupons")}</h2>
              <span className="text-sm text-gray-500">{t("shownCount", { count: initialData.coupons.length })}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-3 pr-4 font-medium">{t("customer")}</th>
                    <th className="py-3 pr-4 font-medium">{t("reward")}</th>
                    <th className="py-3 pr-4 font-medium">{t("status")}</th>
                    <th className="py-3 font-medium">{t("issued")}</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData.coupons.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{row.customerName}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        <div>{row.title}</div>
                        <div className="text-xs text-[#083f30] font-semibold">{row.discountDisplay}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{row.status}</td>
                      <td className="py-3 text-gray-700">{formatDate(row.issuedAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
