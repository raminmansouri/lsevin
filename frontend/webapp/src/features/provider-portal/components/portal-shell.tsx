import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

import { ProviderPortalSidebar } from "./provider-portal-sidebar";
import type { ProviderWorkspace } from "../types";

export function ProviderPortalShell({
  workspace,
  children,
}: {
  locale: string;
  workspace: ProviderWorkspace;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-0 lg:flex-row">
        <ProviderPortalSidebar workspace={workspace} />

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Provider workspace</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">{workspace.provider.displayName}</h2>
                  <Badge variant={workspace.provider.isActive ? "default" : "secondary"}>{workspace.provider.isActive ? "Active" : "Inactive"}</Badge>
                  <Badge variant="outline">Role: {workspace.role}</Badge>
                  {workspace.provider.accredited ? <Badge variant="outline">Accredited</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {workspace.provider.providerTypeName} · {workspace.provider.city}, {workspace.provider.country}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <Badge variant="outline" className="justify-center rounded-xl px-3 py-2">{workspace.stats.activeServices}/{workspace.stats.services} active services</Badge>
                <Badge variant="outline" className="justify-center rounded-xl px-3 py-2">{workspace.stats.staff} staff</Badge>
                <Badge variant="outline" className="justify-center rounded-xl px-3 py-2">{workspace.stats.pendingBookings} active bookings</Badge>
                <Badge variant="outline" className="justify-center rounded-xl px-3 py-2">{workspace.stats.reviews} reviews</Badge>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
