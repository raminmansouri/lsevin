"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import {
  Award,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Percent,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

import { providerResourceConfigs } from "../resource-config";
import type { ProviderWorkspace } from "../types";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const topLinks = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "viewDashboard" as const },
  { href: "profile", label: "Profile", icon: Building2, permission: "manageProfile" as const },
  { href: "services", label: "Services", icon: Sparkles, permission: "manageServices" as const },
  { href: "staff", label: "Staff", icon: Users, permission: "manageStaff" as const },
  { href: "availability", label: "Availability", icon: CalendarDays, permission: "manageAvailability" as const },
  { href: "bookings", label: "Bookings", icon: FileText, permission: "manageBookings" as const },
  { href: "media", label: "Media", icon: ImageIcon, permission: "manageMedia" as const },
  { href: "reviews", label: "Reviews", icon: MessageSquare, permission: "viewReviews" as const },
  { href: "offers", label: "Offers", icon: Percent, permission: "manageOffers" as const },
  { href: "billing", label: "Billing", icon: CreditCard, permission: "viewBilling" as const },
  { href: "support", label: "Support", icon: LifeBuoy, permission: "manageSupport" as const },
  { href: "settings", label: "Settings", icon: Settings, permission: "manageSettings" as const },
];

const groupIcons: Record<string, any> = {
  Profile: Building2,
  Services: Sparkles,
  Staff: Users,
  Scheduling: CalendarDays,
  Commercial: Banknote,
  Support: LifeBuoy,
  Customer: MessageSquare,
};

const resourceIcons: Record<string, any> = {
  "provider-certifications": ShieldCheck,
  "provider-policies": FileText,
  "provider-gallery": ImageIcon,
  "provider-attributes": ClipboardList,
  services: Sparkles,
  "service-gallery": ImageIcon,
  "service-included": Briefcase,
  "service-process": ClipboardList,
  "service-faqs": HelpCircle,
  "service-attribute-values": ClipboardList,
  "provider-staff-links": Users,
  "staff-profiles": Users,
  "staff-certifications": Award,
  "staff-credentials": ShieldCheck,
  "staff-education": BookOpen,
  "staff-achievements": Award,
  "staff-gallery": ImageIcon,
  "staff-before-after": ImageIcon,
  "staff-availability": CalendarDays,
  "staff-services": Briefcase,
  "operating-hours": CalendarDays,
  offers: Gift,
  "payout-accounts": Banknote,
  "support-tickets": LifeBuoy,
  bookings: FileText,
  reviews: MessageSquare,
  "customer-requests": HelpCircle,
  "provider-ledger": CreditCard,
  invoices: FileText,
};

function resourceGroups() {
  const groups = new Map<string, typeof providerResourceConfigs>();
  for (const config of providerResourceConfigs) {
    const items = groups.get(config.group) || [];
    items.push(config);
    groups.set(config.group, items);
  }
  return Array.from(groups.entries());
}

export function ProviderPortalSidebar({ workspace }: { workspace: ProviderWorkspace }) {
  const segments = useSelectedLayoutSegments();
  const currentPath = segments.length ? segments.join("/") : "dashboard";
  const base = `/provider-portal/providers/${workspace.provider.id}`;

  return (
    <aside className="z-30 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shrink-0">
      <div className="flex h-full flex-col overflow-hidden bg-slate-950 text-white shadow-2xl lg:rounded-r-[2rem]">
        <div className="border-b border-white/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">LSevin Provider Admin</p>
          <h1 className="mt-3 line-clamp-2 text-2xl font-bold tracking-tight text-white">{workspace.provider.displayName}</h1>
          <p className="mt-1 text-sm text-white/55">{workspace.provider.providerTypeName}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={workspace.provider.isActive ? "default" : "secondary"}>{workspace.provider.isActive ? "Active" : "Inactive"}</Badge>
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white">{workspace.role}</Badge>
            {workspace.provider.accredited ? <Badge variant="outline" className="border-white/15 bg-white/5 text-white">Accredited</Badge> : null}
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {topLinks.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={`${base}/${item.href}`} className={classNames("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-white text-slate-950 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">CRUD page data</p>
            <div className="space-y-4">
              {resourceGroups().map(([group, resources]) => {
                const GroupIcon = groupIcons[group] || ClipboardList;
                const visible = resources;
                return (
                  <div key={group}>
                    <div className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold text-white/55">
                      <GroupIcon className="h-3.5 w-3.5" />
                      <span>{group}</span>
                    </div>
                    <div className="space-y-1">
                      {visible.map((resource) => {
                        const Icon = resourceIcons[resource.key] || ClipboardList;
                        const href = `manage/${resource.key}`;
                        const active = currentPath === href || currentPath.startsWith(href + "/");
                        return (
                          <Link key={resource.key} href={`${base}/${href}`} className={classNames("flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition", active ? "bg-white/15 text-white" : "text-white/45 hover:bg-white/10 hover:text-white")}>
                            <Icon className="h-3.5 w-3.5" />
                            <span>{resource.pluralLabel}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="space-y-2 border-t border-white/10 bg-white/[0.03] p-4">
          <Link href="/provider-portal" className="block rounded-2xl px-3 py-2 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white">Switch provider</Link>
          <Link href="/provider-portal/applications" className="block rounded-2xl px-3 py-2 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white">My applications</Link>
        </div>
      </div>
    </aside>
  );
}
