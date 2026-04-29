import type { ReactNode } from "react";
import { Building2, CalendarDays, CreditCard, FileText, ImageIcon, LayoutDashboard, LifeBuoy, MessageSquare, Percent, Settings, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import type { ProviderWorkspace } from "../types";

const items = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "viewDashboard" },
  { href: "profile", label: "Profile", icon: Building2, permission: "manageProfile" },
  { href: "services", label: "Services", icon: Sparkles, permission: "manageServices" },
  { href: "staff", label: "Staff", icon: Users, permission: "manageStaff" },
  { href: "availability", label: "Availability", icon: CalendarDays, permission: "manageAvailability" },
  { href: "bookings", label: "Bookings", icon: FileText, permission: "manageBookings" },
  { href: "media", label: "Media", icon: ImageIcon, permission: "manageMedia" },
  { href: "reviews", label: "Reviews", icon: MessageSquare, permission: "viewReviews" },
  { href: "offers", label: "Offers", icon: Percent, permission: "manageOffers" },
  { href: "billing", label: "Billing", icon: CreditCard, permission: "viewBilling" },
  { href: "support", label: "Support", icon: LifeBuoy, permission: "manageSupport" },
  { href: "settings", label: "Settings", icon: Settings, permission: "manageSettings" },
] as const;

export function ProviderPortalShell({
  locale,
  workspace,
  children,
}: {
  locale: string;
  workspace: ProviderWorkspace;
  children: ReactNode;
}) {
  const base = `/provider-portal/providers/${workspace.provider.id}`;

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-72">
          <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
            <div className="border-b bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Provider portal</p>
                  <h1 className="mt-2 text-xl font-bold text-slate-950">{workspace.provider.displayName}</h1>
                  <p className="mt-1 text-sm text-slate-500">{workspace.provider.providerTypeName}</p>
                </div>
                <Badge variant={workspace.provider.isActive ? "default" : "secondary"}>
                  {workspace.provider.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">{workspace.role}</Badge>
                {workspace.provider.accredited ? <Badge variant="outline">Accredited</Badge> : null}
              </div>
            </div>

            <nav className="space-y-1 p-3">
              {items
                .filter((item) => workspace.permissions[item.permission])
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={`${base}/${item.href}`}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            <div className="border-t bg-slate-50 p-4">
              <Link href="/provider-portal" className="text-sm font-medium text-slate-600 hover:text-slate-950">
                Switch provider
              </Link>
            </div>
          </Card>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">{workspace.provider.city}, {workspace.provider.country}</p>
                <h2 className="text-2xl font-bold text-slate-950">{workspace.provider.displayName}</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                <Badge variant="outline">{workspace.stats.activeServices}/{workspace.stats.services} active services</Badge>
                <Badge variant="outline">{workspace.stats.pendingBookings} active bookings</Badge>
                <Badge variant="outline">{workspace.stats.reviews} reviews</Badge>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
