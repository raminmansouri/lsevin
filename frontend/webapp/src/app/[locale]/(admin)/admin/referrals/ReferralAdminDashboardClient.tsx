"use client";

import Link from "next/link";
import { BarChart3, Gift, TicketPercent, UserPlus, Users } from "lucide-react";

import type { ReferralAdminDashboardData } from "./types";

interface ReferralAdminDashboardClientProps {
  initialData: ReferralAdminDashboardData;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-US", {
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
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Program Admin</h1>
            <p className="text-gray-600 mt-1">
              Active program: {initialData.program.name} ({initialData.program.code})
            </p>
          </div>

          <Link
            href="/app/admin/referrals/policies"
            className="inline-flex items-center justify-center rounded-xl bg-[#083f30] px-4 py-2.5 text-white font-semibold hover:bg-[#0a5a44] transition-colors"
          >
            Manage Policy
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              title: "Active Codes",
              value: initialData.summary.activeCodes,
              icon: Gift,
            },
            {
              title: "Invitations",
              value: initialData.summary.invitations,
              icon: UserPlus,
            },
            {
              title: "Registrations",
              value: initialData.summary.registrations,
              icon: Users,
            },
            {
              title: "Profile Completions",
              value: initialData.summary.profileCompletions,
              icon: BarChart3,
            },
            {
              title: "Coupons Issued",
              value: initialData.summary.couponsIssued,
              icon: TicketPercent,
            },
            {
              title: "Coupons Redeemed",
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
              <h2 className="text-xl font-bold text-gray-900">Recent Invitations</h2>
              <span className="text-sm text-gray-500">{initialData.invitations.length} shown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-3 pr-4 font-medium">Referrer</th>
                    <th className="py-3 pr-4 font-medium">Referee</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Invited</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData.invitations.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{row.referrer}</td>
                      <td className="py-3 pr-4 text-gray-700">{row.referee}</td>
                      <td className="py-3 pr-4 text-gray-700">{row.status}</td>
                      <td className="py-3 text-gray-700">{formatDate(row.invitedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Coupons</h2>
              <span className="text-sm text-gray-500">{initialData.coupons.length} shown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-3 pr-4 font-medium">Customer</th>
                    <th className="py-3 pr-4 font-medium">Reward</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Issued</th>
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
                      <td className="py-3 text-gray-700">{formatDate(row.issuedAt)}</td>
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
