import { CalendarCheck, CreditCard, MessageCircle, Sparkles, Star, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ProviderWorkspace } from "../types";

function Metric({ title, value, hint, icon: Icon }: { title: string; value: string | number; hint: string; icon: any }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-950">{value}</div>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function ProviderDashboard({ workspace }: { workspace: ProviderWorkspace }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric title="Services" value={`${workspace.stats.activeServices}/${workspace.stats.services}`} hint="Active / total service rows" icon={Sparkles} />
        <Metric title="Staff" value={workspace.stats.staff} hint="Active provider staff links" icon={Users} />
        <Metric title="Bookings" value={workspace.stats.bookings} hint={`${workspace.stats.pendingBookings} pending or confirmed`} icon={CalendarCheck} />
        <Metric title="Reviews" value={workspace.stats.reviews} hint={`${workspace.provider.rating.toFixed(2)} rating, ${workspace.provider.reviewCount} counter`} icon={Star} />
        <Metric title="Support" value={workspace.stats.unreadTickets} hint="Open or in-progress tickets" icon={MessageCircle} />
        <Metric
          title="Pending ledger"
          value={`${workspace.stats.ledgerCurrency || ""} ${workspace.stats.pendingLedgerAmount.toLocaleString()}`.trim()}
          hint="Provider ledger pending amount"
          icon={CreditCard}
        />
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Operational guardrails</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            Providers can update profile content, images, services, staff, availability, offers, and support tickets according to role permissions.
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            Provider type, country/city, verified status, sponsorship, compensation, and payout activation remain admin-controlled.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
