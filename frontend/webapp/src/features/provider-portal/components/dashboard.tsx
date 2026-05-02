import {
  Award,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  FileText,
  HelpCircle,
  ImageIcon,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  Percent,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import { providerResourceConfigs } from "../resource-config";
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

const icons: Record<string, any> = {
  "provider-certifications": ShieldCheck,
  "provider-policies": FileText,
  "provider-gallery": ImageIcon,
  "provider-attributes": Building2,
  services: Sparkles,
  "service-gallery": ImageIcon,
  "service-included": Briefcase,
  "service-process": CalendarCheck,
  "service-faqs": HelpCircle,
  "service-attribute-values": Building2,
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
  offers: Percent,
  "payout-accounts": Banknote,
  "support-tickets": LifeBuoy,
  bookings: FileText,
  reviews: MessageSquare,
  "customer-requests": HelpCircle,
  "provider-ledger": CreditCard,
  invoices: FileText,
};

function ResourceCard({ base, resource }: { base: string; resource: (typeof providerResourceConfigs)[number] }) {
  const Icon = icons[resource.key] || Building2;
  return (
    <Link href={`${base}/manage/${resource.key}`} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">{resource.pluralLabel}</h3>
            <Badge variant="outline" className="rounded-lg text-[10px]">{resource.group}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{resource.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
            {resource.create ? <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">Create</span> : <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">No create</span>}
            {resource.update ? <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">Edit</span> : <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">Read only</span>}
            {resource.delete ? <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">Delete</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProviderDashboard({ workspace }: { workspace: ProviderWorkspace }) {
  const base = `/provider-portal/providers/${workspace.provider.id}`;
  const visibleResources = providerResourceConfigs;
  const groups = visibleResources.reduce<Record<string, typeof visibleResources>>((acc, resource) => {
    acc[resource.group] ||= [];
    acc[resource.group].push(resource);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Provider admin panel</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Manage all data shown on your LSevin provider page</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          This dashboard is now organized like a real back office: profile content, services, service content blocks, staff, scheduling, offers, billing, support, bookings, reviews and customer requests.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric title="Services" value={`${workspace.stats.activeServices}/${workspace.stats.services}`} hint="Active / total service rows" icon={Sparkles} />
        <Metric title="Staff" value={workspace.stats.staff} hint="Active provider staff links" icon={Users} />
        <Metric title="Bookings" value={workspace.stats.bookings} hint={`${workspace.stats.pendingBookings} pending or confirmed`} icon={CalendarCheck} />
        <Metric title="Reviews" value={workspace.stats.reviews} hint={`${workspace.provider.rating.toFixed(2)} rating, ${workspace.provider.reviewCount} counter`} icon={Star} />
        <Metric title="Support" value={workspace.stats.unreadTickets} hint="Open or in-progress tickets" icon={MessageCircle} />
        <Metric title="Pending ledger" value={`${workspace.stats.ledgerCurrency || ""} ${workspace.stats.pendingLedgerAmount.toLocaleString()}`.trim()} hint="Provider ledger pending amount" icon={CreditCard} />
      </div>

      {Object.entries(groups).map(([group, resources]) => (
        <Card key={group} className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{group}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => <ResourceCard key={resource.key} base={base} resource={resource} />)}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Provider ownership guardrails</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">Every query and mutation is scoped through `provider_portal.provider_members` first, then through the actual provider-owned table relationship.</div>
          <div className="rounded-2xl bg-slate-50 p-4">Admin-only business controls remain outside this provider portal: provider type, sponsorship, verified flags, commission policy, payout approval and global service definitions.</div>
        </CardContent>
      </Card>
    </div>
  );
}
