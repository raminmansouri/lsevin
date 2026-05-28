import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import { ProviderPortalSidebar } from "./provider-portal-sidebar";
import { tCommon, tStatus } from "../lib/i18n";

import type { ProviderWorkspace } from "../types";

export function ProviderPortalShell({
  workspace,
  children,
}: {
  locale: string;
  workspace: ProviderWorkspace;
  children: ReactNode;
}) {
  const t = useTranslations("ProviderPortal");

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-0 lg:flex-row">
        <ProviderPortalSidebar workspace={workspace} />

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {tCommon(t, "providerWorkspace", "Provider workspace")}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    {workspace.provider.displayName}
                  </h2>
                  <Badge
                    variant={
                      workspace.provider.isActive ? "default" : "secondary"
                    }
                  >
                    {workspace.provider.isActive
                      ? tStatus(t, "active")
                      : tStatus(t, "inactive")}
                  </Badge>
                  <Badge variant="outline">
                    {tCommon(t, "roleValue", "role: {role}", {
                      role: workspace.role,
                    })}
                  </Badge>
                  {workspace.provider.accredited ? (
                    <Badge variant="outline">
                      {tCommon(t, "accredited", "Accredited")}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {workspace.provider.providerTypeName} ·{" "}
                  {workspace.provider.city}, {workspace.provider.country}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <Badge
                  variant="outline"
                  className="justify-center rounded-xl px-3 py-2"
                >
                  {tCommon(
                    t,
                    "activeServicesCount",
                    "{active}/{total} active services",
                    {
                      active: workspace.stats.activeServices,
                      total: workspace.stats.services,
                    },
                  )}
                </Badge>
                <Badge
                  variant="outline"
                  className="justify-center rounded-xl px-3 py-2"
                >
                  {tCommon(t, "staffCount", "{count} staff", {
                    count: workspace.stats.staff,
                  })}
                </Badge>
                <Badge
                  variant="outline"
                  className="justify-center rounded-xl px-3 py-2"
                >
                  {tCommon(
                    t,
                    "activeBookingsCount",
                    "{count} active bookings",
                    { count: workspace.stats.pendingBookings },
                  )}
                </Badge>
                <Badge
                  variant="outline"
                  className="justify-center rounded-xl px-3 py-2"
                >
                  {tCommon(t, "reviewsCount", "{count} reviews", {
                    count: workspace.stats.reviews,
                  })}
                </Badge>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
