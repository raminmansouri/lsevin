import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime, formatNumber } from "@core/lib/format";
import { createAdminSnapshotAction, createExportJobAction } from "../actions";
import { getModuleSummary, listSnapshots } from "../repository";

export async function AdminPage() {
  const [summary, snapshots] = await Promise.all([getModuleSummary(), listSnapshots(undefined, 50)]);
  const firstSnapshot = snapshots[0];
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Reports" description="Admin-wide launch dashboard for supply acquisition, content, bookings, payments, reviews, tickets, and front conversion snapshots." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card><CardContent><div className="text-sm font-bold text-slate-950">Profile views</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.profileViews)}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Bookings</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.bookingsCount)}</p><p className="text-xs text-muted-foreground">Paid {formatNumber(summary.paidBookingsCount)}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Tickets</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.ticketsCount)}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Open invoices</div><p className="mt-1 text-2xl font-bold">{formatNumber(summary.openInvoicesCount)}</p></CardContent></Card></div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader><CardTitle>Report snapshots</CardTitle></CardHeader><CardContent>{snapshots.length ? <div className="space-y-3">{snapshots.map((snapshot) => <div key={snapshot.id} className="rounded-lg border border-border p-3 text-sm"><div className="font-semibold">{snapshot.scopeType} · {snapshot.reportKey}</div><div className="font-mono text-xs text-muted-foreground">{snapshot.id}</div><div className="mt-1 text-xs text-muted-foreground">{formatDateTime(snapshot.createdAt)}</div><pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(snapshot.metrics, null, 2)}</pre></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No snapshots yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Snapshot / export</CardTitle></CardHeader><CardContent className="space-y-5"><form action={createAdminSnapshotAction} className="space-y-3"><Field label="Report key"><Input name="reportKey" defaultValue="admin_dashboard" /></Field><Button type="submit" className="w-full">Capture admin snapshot</Button></form><form action={createExportJobAction} className="space-y-3 border-t border-border pt-5"><Field label="Snapshot ID"><Input name="snapshotId" defaultValue={firstSnapshot?.id ?? ""} /></Field><Field label="Format"><Select name="exportFormat" defaultValue="xlsx"><option value="xlsx">XLSX</option><option value="csv">CSV</option><option value="pdf">PDF</option></Select></Field><Button type="submit" variant="secondary" className="w-full">Queue export</Button></form></CardContent></Card>
      </div>
    </div>
  );
}
