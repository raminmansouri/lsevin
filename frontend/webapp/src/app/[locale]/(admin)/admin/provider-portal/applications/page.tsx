import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listAllProviderApplications } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function AdminProviderApplicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireCurrentUserId(true);
  const applications = await listAllProviderApplications(locale);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-bold text-slate-950">Provider portal applications</h1>
      </div>

      <div className="grid gap-3">
        {applications.map((app) => (
          <Card key={app.id} className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{app.displayName}</h2>
                  <Badge>{app.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{app.providerTypeName} · {app.legalName || "-"} · {app.email || "-"}</p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/admin/provider-portal/applications/${app.id}`}>Review</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {!applications.length ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="p-10 text-center text-sm text-slate-500">No applications.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
