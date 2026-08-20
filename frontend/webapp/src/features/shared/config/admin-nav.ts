import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Award,
  BellRing,
  BookMarked,
  BookOpen,
  Boxes,
  Briefcase,
  Bug,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coins,
  CreditCard,
  Database,
  FileClock,
  FileCog,
  FileStack,
  FolderTree,
  GalleryHorizontal,
  Gift,
  Handshake,
  Images,
  Inbox,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  MapPin,
  MessageSquareQuote,
  MessageSquareText,
  MessagesSquare,
  Package,
  PackageOpen,
  Percent,
  Plug,
  Receipt,
  ReceiptText,
  RotateCcw,
  Scale,
  ScrollText,
  Settings,
  Settings2,
  Shapes,
  Share2,
  ShoppingBag,
  Stethoscope,
  TableProperties,
  Tags,
  Ticket,
  TicketCheck,
  TicketPercent,
  TrendingUp,
  Undo2,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";

/**
 * The admin panel's navigation tree.
 *
 * This replaced a flat, hand-formatted array of 17 icon-less entries that
 * reached 36 of the panel's ~50 destinations. Whole feature areas — loyalty's
 * six sub-pages, commercial's four, marketing offers, referrals, the media
 * library, bug reports, the shop — existed on disk but were reachable only by
 * guessing the URL or by finding a tile inside some other page.
 *
 * Two rules keep it honest:
 *
 *  1. A group is a *heading*, never a destination. `sidebar-item.tsx` renders a
 *     group as a disclosure trigger, so a `href` on a group would be silently
 *     unreachable — which is exactly how /admin/customers and /admin/commercial
 *     came to be reachable only through a duplicated child entry.
 *  2. Every leaf appears exactly once. The old tree listed six pages twice
 *     (a parent repeating its own first child), and both copies highlighted
 *     together.
 *
 * `titleKey` resolves against the `Admin` namespace. Keys live under `nav.` so
 * they cannot collide with the entity labels already in that namespace.
 */
export type AdminNavLeaf = {
  /** Message key under `Admin.nav`, and the React key for the row. */
  titleKey: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  titleKey: string;
  icon: LucideIcon;
  items: AdminNavLeaf[];
};

export type AdminNavEntry = AdminNavLeaf | AdminNavGroup;

export function isNavGroup(entry: AdminNavEntry): entry is AdminNavGroup {
  return "items" in entry;
}

export const ADMIN_NAV: AdminNavEntry[] = [
  { titleKey: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },

  {
    titleKey: "bookings",
    icon: CalendarCheck,
    items: [
      { titleKey: "bookingsList", href: "/admin/bookings", icon: CalendarCheck },
      { titleKey: "bookingDrafts", href: "/admin/booking-drafts", icon: FileClock },
      { titleKey: "bookingCalendar", href: "/admin/booking-calendar", icon: CalendarDays },
      { titleKey: "availability", href: "/admin/availability", icon: Clock },
    ],
  },

  {
    titleKey: "finance",
    icon: Wallet,
    items: [
      { titleKey: "payments", href: "/admin/payments", icon: CreditCard },
      { titleKey: "paymentGateways", href: "/admin/payment-gateways", icon: Plug },
      { titleKey: "walletTransactions", href: "/admin/wallet-transactions", icon: ArrowLeftRight },
      { titleKey: "walletPaymentIntents", href: "/admin/wallet-payment-intents", icon: WalletCards },
      { titleKey: "refunds", href: "/admin/refunds", icon: RotateCcw },
      { titleKey: "currencies", href: "/admin/finance/currencies", icon: Coins },
      { titleKey: "exchangeRates", href: "/admin/finance/exchange-rates", icon: TrendingUp },
    ],
  },

  {
    titleKey: "commercial",
    icon: Landmark,
    items: [
      { titleKey: "commercialOverview", href: "/admin/commercial", icon: Landmark },
      { titleKey: "commercialPolicies", href: "/admin/commercial/policies", icon: Scale },
      { titleKey: "commercialPaymentPolicies", href: "/admin/commercial/payment-policies", icon: ReceiptText },
      { titleKey: "providerLedgers", href: "/admin/commercial/provider-ledgers", icon: BookOpen },
      { titleKey: "commercialRefundRequests", href: "/admin/commercial/refund-requests", icon: Undo2 },
    ],
  },

  {
    titleKey: "providers",
    icon: Building2,
    items: [
      { titleKey: "serviceProviders", href: "/admin/service-providers", icon: Building2 },
      { titleKey: "serviceProvidersRequest", href: "/admin/service-providers-request", icon: UserPlus },
      { titleKey: "providerApplications", href: "/admin/provider-portal/applications", icon: ClipboardCheck },
      { titleKey: "providerTypes", href: "/admin/provider-types", icon: Shapes },
      { titleKey: "providerPolicyTypes", href: "/admin/provider-policy-types", icon: ScrollText },
      { titleKey: "staff", href: "/admin/staff", icon: Stethoscope },
      { titleKey: "categories", href: "/admin/categories", icon: FolderTree },
      { titleKey: "serviceDefinitions", href: "/admin/service-definitions", icon: Briefcase },
    ],
  },

  {
    titleKey: "customers",
    icon: Users,
    items: [
      { titleKey: "customersList", href: "/admin/customers", icon: Users },
      { titleKey: "identityUsers", href: "/admin/identity-users", icon: UserCog },
      { titleKey: "pickedLocations", href: "/admin/picked-locations", icon: MapPin },
    ],
  },

  {
    titleKey: "marketing",
    icon: Gift,
    items: [
      { titleKey: "loyaltyOverview", href: "/admin/loyalty", icon: Gift },
      { titleKey: "loyaltyTiers", href: "/admin/loyalty/tiers", icon: Layers },
      { titleKey: "loyaltyAccounts", href: "/admin/loyalty/accounts", icon: Award },
      { titleKey: "loyaltyCoupons", href: "/admin/loyalty/coupons", icon: Ticket },
      { titleKey: "loyaltyCustomerCoupons", href: "/admin/loyalty/customer-coupons", icon: TicketCheck },
      { titleKey: "loyaltyLedger", href: "/admin/loyalty/ledger", icon: BookMarked },
      { titleKey: "loyaltyReferrals", href: "/admin/loyalty/referrals", icon: Share2 },
      { titleKey: "marketingOffers", href: "/admin/marketing/offers", icon: Percent },
      { titleKey: "referralProgram", href: "/admin/referrals", icon: Handshake },
      { titleKey: "referralPolicies", href: "/admin/referrals/policies", icon: FileCog },
    ],
  },

  {
    titleKey: "content",
    icon: LayoutTemplate,
    items: [
      { titleKey: "homeSections", href: "/admin/home-sections", icon: LayoutTemplate },
      { titleKey: "sponsoredSlider", href: "/admin/sponsored-slider", icon: GalleryHorizontal },
      { titleKey: "specialPackages", href: "/admin/special-packages", icon: PackageOpen },
      { titleKey: "authContent", href: "/admin/auth-content", icon: KeyRound },
      { titleKey: "mediaLibrary", href: "/admin/media", icon: Images },
    ],
  },

  {
    titleKey: "support",
    icon: LifeBuoy,
    items: [
      { titleKey: "supportInbox", href: "/admin/support", icon: Inbox },
      { titleKey: "supportConversations", href: "/admin/support/conversations", icon: MessagesSquare },
      { titleKey: "cannedReplies", href: "/admin/support/canned-replies", icon: MessageSquareText },
      { titleKey: "supportTags", href: "/admin/support/tags", icon: Tags },
      { titleKey: "supportSettings", href: "/admin/support/settings", icon: Settings2 },
      // Renamed from /admin/consulting; the old sidebar still pointed at the
      // old path, which no longer has a page.tsx.
      { titleKey: "consultings", href: "/admin/consultation-requests", icon: MessageSquareQuote },
      { titleKey: "bugReports", href: "/admin/bug-reports", icon: Bug },
      { titleKey: "notificationTemplates", href: "/admin/notification-templates", icon: BellRing },
    ],
  },

  {
    titleKey: "shop",
    icon: ShoppingBag,
    items: [
      { titleKey: "shopOverview", href: "/admin/shop", icon: ShoppingBag },
      { titleKey: "shopOrders", href: "/admin/shop/orders", icon: Receipt },
      { titleKey: "shopProducts", href: "/admin/shop/products", icon: Package },
      { titleKey: "shopInventory", href: "/admin/shop/inventory", icon: Boxes },
      { titleKey: "shopCoupons", href: "/admin/shop/coupons", icon: TicketPercent },
      { titleKey: "shopSettings", href: "/admin/shop/settings", icon: Settings },
    ],
  },

  {
    titleKey: "platform",
    icon: Database,
    items: [
      { titleKey: "platformData", href: "/admin/platform-data", icon: Database },
      { titleKey: "formBuilder", href: "/admin/form-builder", icon: ClipboardList },
      { titleKey: "formSubmissions", href: "/admin/form-builder/submissions", icon: FileStack },
      { titleKey: "tableBrowser", href: "/admin", icon: TableProperties },
    ],
  },
];

/** Every leaf in the tree, flattened — used by the ⌘K palette and breadcrumbs. */
export const ADMIN_NAV_LEAVES: Array<AdminNavLeaf & { groupKey?: string }> =
  ADMIN_NAV.flatMap((entry) =>
    isNavGroup(entry)
      ? entry.items.map((item) => ({ ...item, groupKey: entry.titleKey }))
      : [entry]
  );
