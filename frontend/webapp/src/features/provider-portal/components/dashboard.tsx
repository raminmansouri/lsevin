import {
  Award,
  Banknote,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  HelpCircle,
  Gift,
  ImageIcon,
  LifeBuoy,
  ListChecks,
  MessageCircle,
  Percent,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

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

function RouteCard({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: any }) {
  return (
    <Link href={href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function ProviderDashboard({ workspace }: { workspace: ProviderWorkspace }) {
  const base = `/provider-portal/providers/${workspace.provider.id}`;

  const shortcuts = [
    workspace.permissions.manageProfile ? { href: `${base}/profile`, title: "Profile", description: "Edit public provider name, descriptions, image, contact, languages and specialties.", icon: Sparkles } : null,
    workspace.permissions.manageProfile ? { href: `${base}/profile/certifications`, title: "Provider certifications", description: "Add and maintain provider-owned certification records.", icon: ShieldCheck } : null,
    workspace.permissions.manageProfile ? { href: `${base}/profile/policies`, title: "Provider policies", description: "Manage cancellation, refund, privacy and custom provider policies.", icon: Award } : null,
    workspace.permissions.manageServices ? { href: `${base}/services/new`, title: "Add service", description: "Create a provider-owned service linked to a global service definition.", icon: Plus } : null,
    workspace.permissions.manageServices ? { href: `${base}/services/gallery/new`, title: "Service gallery", description: "Add image, GIF, video and file records for each provider service.", icon: ImageIcon } : null,
    workspace.permissions.manageServices ? { href: `${base}/services/add-ons/new`, title: "Service add-ons", description: "Enable add-ons and provider-specific add-on pricing per service.", icon: Gift } : null,
    workspace.permissions.manageServices ? { href: `${base}/services/included/new`, title: "Included items", description: "Maintain what is included in each service package.", icon: ListChecks } : null,
    workspace.permissions.manageServices ? { href: `${base}/services/process/new`, title: "Process steps", description: "Create service journey/process records.", icon: CalendarCheck } : null,
    workspace.permissions.manageServices ? { href: `${base}/services/faqs/new`, title: "Service FAQs", description: "Add service questions and answers.", icon: HelpCircle } : null,
    workspace.permissions.manageStaff ? { href: `${base}/staff/new`, title: "Add staff", description: "Create doctors, specialists, trainers, teachers or other provider staff.", icon: Users } : null,
    workspace.permissions.manageStaff ? { href: `${base}/staff/certifications/new`, title: "Staff certifications", description: "Add provider-owned staff certification records.", icon: Award } : null,
    workspace.permissions.manageStaff ? { href: `${base}/staff/education/new`, title: "Staff education", description: "Maintain degree and institution records.", icon: BookOpen } : null,
    workspace.permissions.manageStaff ? { href: `${base}/staff/availability/new`, title: "Staff availability", description: "Control staff-level availability records.", icon: CalendarDays } : null,
    workspace.permissions.manageStaff ? { href: `${base}/staff/services/new`, title: "Staff service links", description: "Connect staff to service definitions they can provide.", icon: Briefcase } : null,
    workspace.permissions.manageStaff ? { href: `${base}/staff/gallery/new`, title: "Staff gallery", description: "Manage specialist images, videos and profile media.", icon: ImageIcon } : null,
    workspace.permissions.manageAvailability ? { href: `${base}/availability/operating-hours`, title: "Operating hours", description: "Edit provider weekly opening hours and slot interval.", icon: CalendarDays } : null,
    workspace.permissions.manageMedia ? { href: `${base}/media/new`, title: "Provider media", description: "Add provider gallery records.", icon: ImageIcon } : null,
    workspace.permissions.manageOffers ? { href: `${base}/offers/new`, title: "Create offer", description: "Create marketing offers for provider services.", icon: Percent } : null,
    workspace.permissions.managePayouts ? { href: `${base}/billing/payout-accounts`, title: "Payout accounts", description: "Add and manage provider payout account drafts.", icon: Banknote } : null,
    workspace.permissions.manageSupport ? { href: `${base}/support/new`, title: "New support ticket", description: "Open a provider-to-LSevin support ticket.", icon: LifeBuoy } : null,
  ].filter(Boolean) as Array<{ href: string; title: string; description: string; icon: any }>;

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
          <CardTitle>Provider workspace menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((shortcut) => <RouteCard key={shortcut.href} {...shortcut} />)}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Operational guardrails</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            This portal is provider-owned. Providers can only manage records owned by providers where they have a `provider_portal.provider_members` membership.
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            Provider type, city/country, sponsorship, verified trust flags, commission, and payout activation remain admin-controlled.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
