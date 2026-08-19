import { ReportsDashboard } from "../components/ReportsDashboard";
import { getProviderReportsBundle, listReportSnapshots } from "../repository";
import { dateRangeFromSearch, first, type ModulePageProps } from "./_helpers";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";

export async function AdminReportsPage({ searchParams }: ModulePageProps) {
  const providerId = first(searchParams?.providerId, "");
  const [timeZone, locale] = await Promise.all([providerId ? getProviderTimeZone(providerId) : Promise.resolve("Asia/Tehran"), getPortalLocale()]);
  const range = dateRangeFromSearch(searchParams, timeZone);

  if (!providerId) {
    const snapshots = await listReportSnapshots(undefined, 50);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Reports</h2>
          <p className="mt-2 text-sm text-muted-foreground">Pass a providerId query string to open provider-level statistics. Recent saved snapshots are listed below.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold">Recent report snapshots</h3>
          <div className="mt-4 divide-y divide-border">
            {snapshots.length ? snapshots.map((snapshot) => (
              <div key={snapshot.id} className="py-3 text-sm">
                <div className="font-semibold">{snapshot.title}</div>
                <div className="text-muted-foreground">{snapshot.reportKey} · {snapshot.periodStart} → {snapshot.periodEnd} · {snapshot.currencyCode}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No snapshots yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  const [reports, snapshots] = await Promise.all([
    getProviderReportsBundle(providerId, range),
    listReportSnapshots(providerId),
  ]);
  return <ReportsDashboard providerId={providerId} reports={reports} snapshots={snapshots} from={range.from} to={range.to} currencyCode={range.currencyCode} locale={locale.header} timeZone={timeZone} />;
}
