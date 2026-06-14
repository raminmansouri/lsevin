import Link from "next/link";
import { BadgePercent, Gift, Medal, ReceiptText, TicketCheck, Trophy, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AdminDashboardStats } from "../types";

const tiles = [
  { href: "/admin/marketing/offers", title: "Marketing offers", description: "Featured campaigns and provider-service offers", icon: BadgePercent },
  { href: "/admin/loyalty/tiers", title: "Loyalty tiers", description: "Cashback levels, colors, benefits and icons", icon: Trophy },
  { href: "/admin/loyalty/accounts", title: "Loyalty accounts", description: "Customer points, current tier and referral codes", icon: Users },
  { href: "/admin/loyalty/coupons", title: "Loyalty coupons", description: "Codes, discount values and targeted services", icon: Gift },
  { href: "/admin/loyalty/customer-coupons", title: "Customer coupons", description: "Assignments, redemptions and booking linkage", icon: TicketCheck },
  { href: "/admin/loyalty/ledger", title: "Ledger", description: "Append-only loyalty points and money history", icon: ReceiptText },
  { href: "/admin/loyalty/referrals", title: "Referrals", description: "Invite status, rewards and qualification tracking", icon: Medal },
];

export function MarketingLoyaltyDashboard({ stats }: { stats: AdminDashboardStats }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Marketing & Loyalty</h1>
        <p className="mt-2 text-muted-foreground">
          Full admin control for offer campaigns, loyalty tiers, accounts, coupons, referrals, and the points ledger.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active offers" value={stats.activeOffers} helper={`${stats.featuredOffers} featured`} />
        <StatCard label="Active coupons" value={stats.activeCoupons} helper={`${stats.availableCustomerCoupons} assigned and available`} />
        <StatCard label="Loyalty accounts" value={stats.totalAccounts} helper={`${stats.totalPoints.toLocaleString()} total active points`} />
        <StatCard label="Pending referrals" value={stats.pendingReferrals} helper={`${stats.ledgerEntries.toLocaleString()} ledger entries`} />
      </div>

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
                  <h2 className="font-semibold">{tile.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tile.description}</p>
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
