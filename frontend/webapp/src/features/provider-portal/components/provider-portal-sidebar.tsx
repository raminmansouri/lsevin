"use client";

import {
  Award,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  HelpCircle,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Percent,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useSelectedLayoutSegments } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

import type { ProviderWorkspace } from "../types";

type MenuChild = {
  href: string;
  label: string;
  permission?: string;
  icon?: any;
};

type MenuGroup = {
  href: string;
  label: string;
  permission: string;
  icon: any;
  children?: MenuChild[];
};

const groups: MenuGroup[] = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "viewDashboard" },
  {
    href: "profile",
    label: "Profile",
    icon: Building2,
    permission: "manageProfile",
    children: [
      { href: "profile", label: "Profile overview", icon: Building2 },
      { href: "profile/certifications", label: "Certifications", icon: ShieldCheck },
      { href: "profile/certifications/new", label: "Add certification", icon: Plus },
      { href: "profile/policies", label: "Policies", icon: FileText },
      { href: "profile/policies/new", label: "Add policy", icon: Plus },
    ],
  },
  {
    href: "services",
    label: "Services",
    icon: Sparkles,
    permission: "manageServices",
    children: [
      { href: "services", label: "All services", icon: Sparkles },
      { href: "services/new", label: "Add service", icon: Plus },
      { href: "services/gallery", label: "Service gallery", icon: ImageIcon },
      { href: "services/gallery/new", label: "Add service media", icon: Plus },
      { href: "services/add-ons", label: "Service add-ons", icon: Gift },
      { href: "services/add-ons/new", label: "Add service add-on", icon: Plus },
      { href: "services/included", label: "Included items", icon: ListChecks },
      { href: "services/included/new", label: "Add included item", icon: Plus },
      { href: "services/process", label: "Process steps", icon: ClipboardList },
      { href: "services/process/new", label: "Add process step", icon: Plus },
      { href: "services/faqs", label: "Service FAQs", icon: HelpCircle },
      { href: "services/faqs/new", label: "Add service FAQ", icon: Plus },
    ],
  },
  {
    href: "staff",
    label: "Staff",
    icon: Users,
    permission: "manageStaff",
    children: [
      { href: "staff", label: "All staff", icon: Users },
      { href: "staff/new", label: "Add staff", icon: Plus },
      { href: "staff/certifications", label: "Staff certifications", icon: Award },
      { href: "staff/certifications/new", label: "Add staff certification", icon: Plus },
      { href: "staff/education", label: "Staff education", icon: BookOpen },
      { href: "staff/education/new", label: "Add staff education", icon: Plus },
      { href: "staff/availability", label: "Staff availability", icon: CalendarDays },
      { href: "staff/availability/new", label: "Add staff availability", icon: Plus },
      { href: "staff/services", label: "Staff service links", icon: Briefcase },
      { href: "staff/gallery", label: "Staff gallery", icon: ImageIcon },
    ],
  },
  {
    href: "availability",
    label: "Availability",
    icon: CalendarDays,
    permission: "manageAvailability",
    children: [
      { href: "availability", label: "Operating hours", icon: CalendarDays },
      { href: "availability/operating-hours", label: "Edit operating hours", icon: CalendarDays },
    ],
  },
  { href: "bookings", label: "Bookings", icon: FileText, permission: "manageBookings" },
  {
    href: "media",
    label: "Media",
    icon: ImageIcon,
    permission: "manageMedia",
    children: [
      { href: "media", label: "Provider gallery", icon: ImageIcon },
      { href: "media/new", label: "Add media", icon: Video },
    ],
  },
  { href: "reviews", label: "Reviews", icon: MessageSquare, permission: "viewReviews" },
  {
    href: "offers",
    label: "Offers",
    icon: Percent,
    permission: "manageOffers",
    children: [
      { href: "offers", label: "All offers", icon: Percent },
      { href: "offers/new", label: "Create offer", icon: Plus },
    ],
  },
  {
    href: "billing",
    label: "Billing",
    icon: CreditCard,
    permission: "viewBilling",
    children: [
      { href: "billing", label: "Ledger + payouts", icon: CreditCard },
      { href: "billing/payout-accounts", label: "Payout accounts", icon: Banknote, permission: "managePayouts" },
      { href: "billing/payout-accounts/new", label: "Add payout account", icon: Plus, permission: "managePayouts" },
    ],
  },
  {
    href: "support",
    label: "Support",
    icon: LifeBuoy,
    permission: "manageSupport",
    children: [
      { href: "support", label: "Tickets", icon: LifeBuoy },
      { href: "support/new", label: "New ticket", icon: HelpCircle },
    ],
  },
  { href: "settings", label: "Settings", icon: Settings, permission: "manageSettings" },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ProviderPortalSidebar({ workspace }: { workspace: ProviderWorkspace }) {
  const segments = useSelectedLayoutSegments();
  const currentPath = segments.length ? segments.join("/") : "dashboard";
  const currentRoot = segments[0] || "dashboard";
  const base = `/provider-portal/providers/${workspace.provider.id}`;

  return (
    <aside className="z-30 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shrink-0">
      <div className="flex h-full flex-col overflow-hidden bg-slate-950 text-white shadow-2xl lg:rounded-r-[2rem]">
        <div className="border-b border-white/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">LSevin Provider</p>
          <h1 className="mt-3 line-clamp-2 text-2xl font-bold tracking-tight text-white">{workspace.provider.displayName}</h1>
          <p className="mt-1 text-sm text-white/55">{workspace.provider.providerTypeName}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={workspace.provider.isActive ? "default" : "secondary"}>{workspace.provider.isActive ? "Active" : "Inactive"}</Badge>
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white">{workspace.role}</Badge>
            {workspace.provider.accredited ? <Badge variant="outline" className="border-white/15 bg-white/5 text-white">Accredited</Badge> : null}
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {groups
            .filter((group) => workspace.permissions[group.permission])
            .map((group) => {
              const Icon = group.icon;
              const active = currentRoot === group.href;
              const children = (group.children || []).filter((child) => !child.permission || workspace.permissions[child.permission]);
              return (
                <div key={group.href} className="space-y-1">
                  <Link
                    href={base + "/" + group.href}
                    className={classNames(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                      active ? "bg-white text-slate-950 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{group.label}</span>
                  </Link>
                  {active && children.length ? (
                    <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
                      {children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = currentPath === child.href || (child.href !== group.href && currentPath.startsWith(child.href + "/"));
                        return (
                          <Link
                            key={child.href}
                            href={base + "/" + child.href}
                            className={classNames(
                              "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                              childActive ? "bg-white/15 text-white" : "text-white/45 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {ChildIcon ? <ChildIcon className="h-3.5 w-3.5" /> : null}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </nav>

        <div className="space-y-2 border-t border-white/10 bg-white/[0.03] p-4">
          <Link href="/provider-portal" className="block rounded-2xl px-3 py-2 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white">
            Switch provider
          </Link>
          <Link href="/provider-portal/applications" className="block rounded-2xl px-3 py-2 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white">
            My applications
          </Link>
        </div>
      </div>
    </aside>
  );
}
