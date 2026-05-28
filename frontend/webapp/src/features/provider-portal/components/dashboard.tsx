import { useTranslations } from "next-intl";

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
import { tCommon, tResourceGroup, tResourceLabel } from "../lib/i18n";

import type { ProviderWorkspace } from "../types";

function Metric({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: any;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
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

function ResourceCard({
  base,
  resource,
}: {
  base: string;
  resource: (typeof providerResourceConfigs)[number];
}) {
  const t = useTranslations("ProviderPortal");
  const Icon = icons[resource.key] || Building2;
  return (
    <Link
      href={`${base}/manage/${resource.key}`}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">
              {tResourceLabel(
                t,
                resource.key,
                resource.pluralLabel,
                "pluralLabel",
              )}
            </h3>
            <Badge variant="outline" className="rounded-lg text-[10px]">
              {tResourceGroup(t, resource.group)}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
            {tResourceLabel(
              t,
              resource.key,
              resource.description,
              "description",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
            {resource.create ? (
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                {tCommon(t, "create", "Create")}
              </span>
            ) : (
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">
                {tCommon(t, "noCreate", "No create")}
              </span>
            )}
            {resource.update ? (
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">
                {tCommon(t, "edit", "Edit")}
              </span>
            ) : (
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">
                {tCommon(t, "readOnly", "Read only")}
              </span>
            )}
            {resource.delete ? (
              <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">
                {tCommon(t, "delete", "Delete")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProviderDashboard({
  workspace,
}: {
  workspace: ProviderWorkspace;
}) {
  const t = useTranslations("ProviderPortal");
  const base = `/provider-portal/providers/${workspace.provider.id}`;
  const visibleResources = providerResourceConfigs;
  const groups = visibleResources.reduce<
    Record<string, typeof visibleResources>
  >((acc, resource) => {
    acc[resource.group] ||= [];
    acc[resource.group].push(resource);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {tCommon(t, "providerAdminPanel", "Provider admin panel")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {tCommon(
            t,
            "dashboardSubtitle",
            "Manage all data shown on your LSevin provider page",
          )}
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          {tCommon(
            t,
            "dashboardDescription",
            "This dashboard is now organized like a real back office: profile content, services, service content blocks, staff, scheduling, offers, billing, support, bookings, reviews and customer requests.",
          )}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title={tCommon(t, "services", "Services")}
          value={`${workspace.stats.activeServices}/${workspace.stats.services}`}
          hint={tCommon(
            t,
            "activeTotalServiceRows",
            "Active / total service rows",
          )}
          icon={Sparkles}
        />
        <Metric
          title={tCommon(t, "staff", "Staff")}
          value={workspace.stats.staff}
          hint={tCommon(
            t,
            "activeProviderStaffLinks",
            "Active provider staff links",
          )}
          icon={Users}
        />
        <Metric
          title={tCommon(t, "bookings", "Bookings")}
          value={workspace.stats.bookings}
          hint={tCommon(
            t,
            "pendingOrConfirmed",
            "{count} pending or confirmed",
            { count: workspace.stats.pendingBookings },
          )}
          icon={CalendarCheck}
        />
        <Metric
          title={tCommon(t, "reviews", "Reviews")}
          value={workspace.stats.reviews}
          hint={tCommon(
            t,
            "ratingCounter",
            "{rating} rating, {count} counter",
            {
              rating: workspace.provider.rating.toFixed(2),
              count: workspace.provider.reviewCount,
            },
          )}
          icon={Star}
        />
        <Metric
          title={tCommon(t, "support", "Support")}
          value={workspace.stats.unreadTickets}
          hint={tCommon(
            t,
            "openOrInProgressTickets",
            "Open or in-progress tickets",
          )}
          icon={MessageCircle}
        />
        <Metric
          title={tCommon(t, "pendingLedger", "Pending ledger")}
          value={`${workspace.stats.ledgerCurrency || ""} ${workspace.stats.pendingLedgerAmount.toLocaleString()}`.trim()}
          hint={tCommon(
            t,
            "providerLedgerPendingAmount",
            "Provider ledger pending amount",
          )}
          icon={CreditCard}
        />
      </div>

      {Object.entries(groups).map(([group, resources]) => (
        <Card key={group} className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{tResourceGroup(t, group)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.key}
                  base={base}
                  resource={resource}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>
            {tCommon(
              t,
              "providerOwnershipGuardrails",
              "Provider ownership guardrails",
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            {tCommon(
              t,
              "guardrailQueryScope",
              "Every query and mutation is scoped through `provider_portal.provider_members` first, then through the actual provider-owned table relationship.",
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            {tCommon(
              t,
              "guardrailAdminControls",
              "Admin-only business controls remain outside this provider portal: provider type, sponsorship, verified flags, commission policy, payout approval and global service definitions.",
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
