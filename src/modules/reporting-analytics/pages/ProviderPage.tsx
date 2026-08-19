import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime, formatNumber } from "@core/lib/format";
import { createProviderSnapshotAction } from "../actions";
import { getModuleSummary, listSnapshots } from "../repository";

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, snapshots] = await Promise.all([getModuleSummary(providerId), listSnapshots(providerId, 20)]);
  return (
    <div className="space-y-6">
      <PageHeader title="Provider Analytics" description="Customer-value dashboard for profile views, bookings, paid bookings, reviews, tickets, invoices, and profile completeness signals." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card><CardContent><div className="text-sm font-bold text-slate-950">Profile views</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.profileViews)}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Bookings</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.bookingsCount)}</p><p className="text-xs text-muted-foreground">Paid {formatNumber(summary.paidBookingsCount)}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Reviews</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.reviewsCount)}</p><p className="text-xs text-muted-foreground">Avg {summary.avgRating}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Open invoices</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.openInvoicesCount)}</p><p className="text-xs text-muted-foreground">Total invoices {formatNumber(summary.invoicesCount)}</p></CardContent></Card></div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader><CardTitle>Snapshots</CardTitle></CardHeader><CardContent>{snapshots.length ? <div className="space-y-3">{snapshots.map((snapshot) => <div key={snapshot.id} className="rounded-lg border border-border p-3 text-sm"><div className="font-semibold">{snapshot.reportKey}</div><div className="font-mono text-xs text-muted-foreground">{snapshot.id}</div><div className="mt-1 text-xs text-muted-foreground">{formatDateTime(snapshot.createdAt)}</div><pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(snapshot.metrics, null, 2)}</pre></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No snapshots yet. Create one before weekly review/export.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Create snapshot</CardTitle></CardHeader><CardContent><form action={createProviderSnapshotAction} className="space-y-3"><input type="hidden" name="providerId" value={providerId} /><Field label="Report key"><Input name="reportKey" defaultValue="provider_dashboard" /></Field><Button type="submit" className="w-full">Capture current metrics</Button></form></CardContent></Card>
      </div>
    </div>
  );
}
