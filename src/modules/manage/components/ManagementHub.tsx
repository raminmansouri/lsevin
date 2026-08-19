import { AlertTriangle, Building2, CalendarClock, CheckCircle2, CreditCard, FileText, Images, MessageSquareText, Stethoscope, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { LinkButton } from "@core/ui/Button";
import type { ProviderManagementSnapshot } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

const modules = [
  { key: "profile", title: "Profile", icon: Building2, description: "Identity, address, contacts, languages, images, and specialties." },
  { key: "services", title: "Services", icon: Stethoscope, description: "Data entry for services, prices, duration, booking settings, and status." },
  { key: "staff", title: "Staff", icon: Users, description: "Create, edit, link, or unlink provider staff and specialists." },
  { key: "media", title: "Media", icon: Images, description: "Provider gallery media shown on LSevin marketplace pages." },
  { key: "availability", title: "Availability", icon: CalendarClock, description: "Operating hours, resources, and generic availability rules." },
  { key: "bookings", title: "Bookings", icon: FileText, description: "Provider-side booking status and operational notes." },
  { key: "reviews", title: "Reviews", icon: MessageSquareText, description: "Customer feedback and provider replies." },
  { key: "finance", title: "Finance", icon: CreditCard, description: "Payout accounts, ledgers, earnings, and settlement readiness." },
];

export function ManagementHub({ providerId, snapshot, locale = "en" }: { providerId: string; snapshot: ProviderManagementSnapshot; locale?: string }) {
  const checklist = [
    { label: "At least one active service", ready: snapshot.activeServices > 0 },
    { label: "At least one staff member", ready: snapshot.staff > 0 },
    { label: "Provider gallery has media", ready: snapshot.gallery > 0 },
    { label: "Operating hours configured", ready: snapshot.operatingHours > 0 },
    { label: "Payout account configured", ready: snapshot.payoutAccounts > 0 },
    { label: "At least one provider member", ready: snapshot.members > 0 },
  ];
  const readyCount = checklist.filter((item) => item.ready).length;

  return localizeReactTree((
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Provider readiness checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-3xl font-black text-slate-950">{readyCount}/{checklist.length}</div>
              <div className="text-sm text-muted-foreground">Core marketplace readiness items completed.</div>
            </div>
            <div className="hidden rounded-full bg-[#f0fdf4] px-4 py-2 text-sm font-bold text-[#065f46] md:block">Self-service management</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                {item.ready ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertTriangle className="text-amber-600" size={18} />}
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.key} className="transition hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#065f46]"><module.icon size={20} /></div>
              <div className="text-lg font-black">{module.title}</div>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{module.description}</p>
              <LinkButton href={`/providers/${providerId}/${module.key}`} variant="secondary" className="mt-4 w-full">Manage {module.title.toLowerCase()}</LinkButton>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ), locale);
}
