import { BadgePercent, Trophy } from "lucide-react";

export const marketingLoyaltyAdminNavigationPatch = [
  {
    label: "Marketing",
    href: "/admin/marketing/offers",
    icon: BadgePercent,
  },
  {
    label: "Loyalty",
    href: "/admin/loyalty",
    icon: Trophy,
    children: [
      { label: "Dashboard", href: "/admin/loyalty" },
      { label: "Tiers", href: "/admin/loyalty/tiers" },
      { label: "Accounts", href: "/admin/loyalty/accounts" },
      { label: "Coupons", href: "/admin/loyalty/coupons" },
      { label: "Customer Coupons", href: "/admin/loyalty/customer-coupons" },
      { label: "Ledger", href: "/admin/loyalty/ledger" },
      { label: "Referrals", href: "/admin/loyalty/referrals" },
    ],
  },
];
