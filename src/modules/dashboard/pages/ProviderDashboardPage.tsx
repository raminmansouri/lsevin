import { BadgePercent, CalendarCheck, CalendarClock, CircleCheckBig, CircleDashed, Image, Star, Stethoscope, Target, Users } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { requireCurrentUser } from "@core/auth/session";
import { can, getProviderRole, type ProviderPermission } from "@core/auth/permissions";
import { formatDateTime } from "@core/lib/format";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import type { ModulePageProps } from "@core/modules/types";
import { dashboardCopy } from "../i18n";
import { providerMarketCopy } from "../marketCopy";
import type { ProviderMarketActionKey } from "../marketTypes";
import { getProviderDashboardMetrics, getProviderMarketReadiness } from "../repository";

function readinessTone(score: number) {
  if (score === 100) return "success" as const;
  if (score >= 60) return "brand" as const;
  return "warning" as const;
}

function nextAction(market: Awaited<ReturnType<typeof getProviderMarketReadiness>>): ProviderMarketActionKey {
  if (!market.profileComplete) return "profile";
  if (market.activeServices < 1) return "services";
  if (market.availabilityRules < 1) return "availability";
  if (market.mediaItems < 1) return "media";
  if (market.activeOffers < 1) return "offers";
  return "bookings";
}

function actionHref(providerId: string, action: ProviderMarketActionKey) {
  const paths: Record<ProviderMarketActionKey, string> = {
    profile: `/providers/${providerId}/profile`,
    services: `/providers/${providerId}/services`,
    availability: `/providers/${providerId}/availability`,
    media: `/providers/${providerId}/media`,
    offers: `/providers/${providerId}/offers`,
    bookings: `/providers/${providerId}/booking-management`,
  };
  return paths[action];
}

export async function ProviderDashboardPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [locale, user] = await Promise.all([getPortalLocale(), requireCurrentUser()]);
  const copy = dashboardCopy(locale.locale);
  const marketCopy = providerMarketCopy(locale.locale);
  const [metrics, market, role] = await Promise.all([
    getProviderDashboardMetrics(providerId, locale.header),
    getProviderMarketReadiness(providerId, locale.header),
    getProviderRole(user.id, providerId),
  ]);
  const actionKey = nextAction(market);
  const action = marketCopy.actions[actionKey];
  const activationPending = market.readinessScore === 100 && !market.providerActive;
  const actionPermissions: Record<ProviderMarketActionKey, ProviderPermission> = { profile: "manageProfile", services: "manageServices", availability: "manageAvailability", media: "manageMedia", offers: "manageServices", bookings: "manageBookings" };
  const canRunAction = Boolean(role && can(role, actionPermissions[actionKey]));
  const readinessLabel = activationPending ? marketCopy.awaitingActivation : market.readinessScore === 100 ? marketCopy.marketReady : market.readinessScore >= 60 ? marketCopy.almostReady : marketCopy.needsSetup;
  const gates = [
    { key: "profile", ready: market.profileComplete, href: actionHref(providerId, "profile"), permission: "manageProfile" as ProviderPermission },
    { key: "services", ready: market.activeServices > 0, href: actionHref(providerId, "services"), permission: "manageServices" as ProviderPermission },
    { key: "availability", ready: market.availabilityRules > 0, href: actionHref(providerId, "availability"), permission: "manageAvailability" as ProviderPermission },
    { key: "media", ready: market.mediaItems > 0, href: actionHref(providerId, "media"), permission: "manageMedia" as ProviderPermission },
    { key: "offers", ready: market.activeOffers > 0, href: actionHref(providerId, "offers"), permission: "manageServices" as ProviderPermission },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title={metrics.providerName || copy.provider.fallbackTitle} description={copy.provider.description} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Stethoscope} label={copy.common.services} value={metrics.services} />
        <StatCard icon={Users} label={copy.common.staff} value={metrics.staff} />
        <StatCard icon={CalendarCheck} label={copy.common.bookings} value={metrics.bookings} />
        <StatCard icon={Star} label={copy.provider.profileStatus} value={metrics.profileReady ? copy.common.ready : copy.common.missing} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div><CardTitle>{marketCopy.readinessTitle}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{marketCopy.readinessDescription}</p></div>
            <Target className="shrink-0 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm text-muted-foreground">{marketCopy.scoreLabel}</p><p className="text-4xl font-black tracking-tight">{market.readinessScore}%</p></div>
              <Badge variant={activationPending ? "warning" : readinessTone(market.readinessScore)}>{readinessLabel}</Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-label={`${marketCopy.scoreLabel}: ${market.readinessScore}%`}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${market.readinessScore}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{marketCopy.nextActionTitle}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{marketCopy.nextActionDescription}</p></CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{activationPending ? marketCopy.activationPendingTitle : action.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{activationPending ? marketCopy.activationPendingDescription : action.description}</p>
            {activationPending ? null : canRunAction ? <LinkButton href={actionHref(providerId, actionKey)} className="mt-4">{action.cta}</LinkButton> : <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">{marketCopy.readOnlyNotice}</p>}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-slate-950">{marketCopy.signalsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={CalendarClock} label={marketCopy.bookings30d} value={market.bookings30d} />
          <StatCard icon={BadgePercent} label={marketCopy.activeOffers} value={market.activeOffers} />
          <StatCard icon={Star} label={marketCopy.rating} value={market.rating.toFixed(1)} />
          <StatCard icon={Users} label={marketCopy.reviews} value={market.reviewCount} />
          <StatCard icon={CalendarCheck} label={marketCopy.firstBooking} value={market.firstBookingAt ? formatDateTime(market.firstBookingAt, locale.header) : marketCopy.notYet} />
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>{marketCopy.checklistTitle}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{marketCopy.checklistDescription}</p></CardHeader>
        <CardContent className="space-y-3">
          {gates.map((gate) => {
            const gateCopy = marketCopy.gates[gate.key];
            const GateIcon = gate.ready ? CircleCheckBig : CircleDashed;
            return (
              <div key={gate.key} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <GateIcon className={gate.ready ? "mt-0.5 shrink-0 text-emerald-600" : "mt-0.5 shrink-0 text-muted-foreground"} size={20} />
                  <div><p className="font-semibold">{gateCopy.label}</p><p className="mt-0.5 text-sm text-muted-foreground">{gateCopy.help}</p></div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={gate.ready ? "success" : "warning"}>{gate.ready ? marketCopy.ready : marketCopy.missing}</Badge>
                  {role && can(role, gate.permission) ? <LinkButton href={gate.href} size="sm" variant="ghost">{marketCopy.open}</LinkButton> : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
