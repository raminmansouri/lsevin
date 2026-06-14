import { useTranslations } from "next-intl";
import { Building2, FilePlus2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import { tCommon, tStatus } from "../lib/i18n";

import type { ProviderApplication, ProviderSummary } from "../types";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("ProviderPortal");
  const variant =
    status === "approved"
      ? "default"
      : status === "rejected"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant as any}>{tStatus(t, status)}</Badge>;
}

export function ProviderPortalHome({
  providers,
  applications,
}: {
  providers: ProviderSummary[];
  applications: ProviderApplication[];
}) {
  const t = useTranslations("ProviderPortal");

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
            {tCommon(t, "lsevinProviderPortal", "LSevin Provider Portal")}
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            {tCommon(
              t,
              "portalHomeTitle",
              "Manage your services, bookings, staff, media, and billing from one place.",
            )}
          </h1>
          <p className="text-base leading-7 text-white/75">
            {tCommon(
              t,
              "portalHomeDescription",
              "Access is scoped by provider membership. New providers submit an application first, then admin approval creates the provider workspace.",
            )}
          </p>
          <Button asChild size="lg" className="rounded-2xl">
            <Link href="/provider-portal/applications/new">
              <FilePlus2 className="mr-2 h-4 w-4" />
              {tCommon(
                t,
                "submitProviderApplication",
                "Submit provider application",
              )}
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {tCommon(t, "yourProviders", "Your providers")}
            </h2>
            <p className="text-sm text-slate-500">
              {tCommon(
                t,
                "chooseProviderWorkspace",
                "Choose a provider workspace to manage operational data.",
              )}
            </p>
          </div>
        </div>

        {providers.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className="overflow-hidden rounded-3xl border-slate-200 shadow-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {provider.name}
                      </CardTitle>
                      <CardDescription>
                        {provider.providerTypeName}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{provider.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                    {provider.description || "-"}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <b>{provider.serviceCount}</b>
                      <br />
                      {tCommon(t, "services", "Services")}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <b>{provider.staffCount}</b>
                      <br />
                      {tCommon(t, "staff", "Staff")}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <b>{provider.bookingCount}</b>
                      <br />
                      {tCommon(t, "bookings", "Bookings")}
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-2xl">
                    <Link
                      href={`/provider-portal/providers/${provider.id}/dashboard`}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      {tCommon(t, "openWorkspace", "Open workspace")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="p-10 text-center">
              <h3 className="text-lg font-semibold">
                {tCommon(
                  t,
                  "noProviderWorkspaceYet",
                  "No provider workspace yet",
                )}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {tCommon(
                  t,
                  "submitApplicationOnceApproved",
                  "Submit an application. Once admin approves it, your workspace will appear here.",
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">
          {tCommon(t, "applications", "Applications")}
        </h2>
        <div className="grid gap-3">
          {applications.length ? (
            applications.map((app) => (
              <Card key={app.id} className="rounded-3xl border-slate-200">
                <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{app.displayName}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {app.providerTypeName} · {app.applicationNumber || app.id}
                    </p>
                    {app.reviewReason ? (
                      <p className="mt-2 text-sm text-red-600">
                        {app.reviewReason}
                      </p>
                    ) : null}
                  </div>
                  {app.serviceProviderId ? (
                    <Button asChild variant="outline" className="rounded-2xl">
                      <Link
                        href={`/provider-portal/providers/${app.serviceProviderId}/dashboard`}
                      >
                        {tCommon(t, "openProvider", "Open provider")}
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-3xl border-dashed">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                {tCommon(t, "noApplicationsYet", "No applications yet.")}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
