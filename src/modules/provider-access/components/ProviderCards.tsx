import { Building2, CalendarCheck, Star, Stethoscope, Users } from "lucide-react";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent } from "@core/ui/Card";
import { Badge } from "@core/ui/Badge";
import { RichTextRenderer } from "@core/ui/RichTextRenderer";
import type { ProviderSummary } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

export function ProviderCards({ providers, locale = "en" }: { providers: ProviderSummary[]; locale?: string }) {
  return localizeReactTree((
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => (
        <Card key={provider.id} className="overflow-hidden">
          <div className="brand-gradient h-24" />
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="-mt-10 flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white bg-muted text-primary shadow-sm">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-950">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground">{provider.providerTypeName}</p>
                </div>
              </div>
              <Badge variant={provider.isActive ? "success" : "warning"}>{provider.role}</Badge>
            </div>
            <div className="mt-3 max-h-12 overflow-hidden text-sm text-muted-foreground">{provider.description ? <RichTextRenderer value={provider.description} className="prose-p:my-0 text-sm text-muted-foreground" /> : <p>No description yet.</p>}</div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              <Metric icon={Stethoscope} value={provider.serviceCount} label="Services" />
              <Metric icon={Users} value={provider.staffCount} label="Staff" />
              <Metric icon={CalendarCheck} value={provider.bookingCount} label="Bookings" />
              <Metric icon={Star} value={provider.rating.toFixed(1)} label="Rating" />
            </div>
            <div className="mt-5 flex gap-2">
              <LinkButton href={`/providers/${provider.id}/dashboard`} className="flex-1">Manage</LinkButton>
              <LinkButton href={`/providers/${provider.id}/profile`} variant="secondary">Profile</LinkButton>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ), locale);
}

function Metric({ icon: Icon, value, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; value: string | number; label: string }) {
  return <div className="rounded-lg bg-muted p-2"><Icon className="mx-auto text-primary" size={15} /><div className="mt-1 font-bold">{value}</div><div className="text-[11px] text-muted-foreground">{label}</div></div>;
}
