"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BadgePercent, Gift, Medal, ReceiptText, TicketCheck, Trophy, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AdminDashboardStats } from "../types";
import { EarnRateSettingsCard } from "./earn-rate-settings-card";

const tiles = [
  { href: "/admin/marketing/offers", key: "offers", icon: BadgePercent },
  { href: "/admin/loyalty/tiers", key: "tiers", icon: Trophy },
  { href: "/admin/loyalty/accounts", key: "accounts", icon: Users },
  { href: "/admin/loyalty/coupons", key: "coupons", icon: Gift },
  { href: "/admin/loyalty/customer-coupons", key: "customerCoupons", icon: TicketCheck },
  { href: "/admin/loyalty/ledger", key: "ledger", icon: ReceiptText },
  { href: "/admin/loyalty/referrals", key: "referrals", icon: Medal },
];

export function MarketingLoyaltyDashboard({
  stats,
  earnRateDivisor,
}: {
  stats: AdminDashboardStats;
  earnRateDivisor: number;
}) {
  const t = useTranslations("AdminPages.marketingLoyalty");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("dashboard.stats.activeOffers")} value={stats.activeOffers} helper={t("dashboard.stats.featured", { count: stats.featuredOffers })} />
        <StatCard label={t("dashboard.stats.activeCoupons")} value={stats.activeCoupons} helper={t("dashboard.stats.assignedAvailable", { count: stats.availableCustomerCoupons })} />
        <StatCard label={t("dashboard.stats.accounts")} value={stats.totalAccounts} helper={t("dashboard.stats.totalPoints", { count: stats.totalPoints })} />
        <StatCard label={t("dashboard.stats.pendingReferrals")} value={stats.pendingReferrals} helper={t("dashboard.stats.ledgerEntries", { count: stats.ledgerEntries })} />
      </div>

      <EarnRateSettingsCard divisor={earnRateDivisor} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.href} href={tile.href} className="group block rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-muted p-3 text-[#084132] transition-colors group-hover:bg-[#084132] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">{t(`dashboard.tiles.${tile.key}.title`)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`dashboard.tiles.${tile.key}.description`)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value.toLocaleString()}</div>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
