import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { reviewMediaAssetAction } from "../actions";
import { getModuleSummary, listMediaAssets } from "../repository";

function statusVariant(status: string) {
  if (["approved"].includes(status)) return "success" as const;
  if (["rejected", "hidden"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function AdminPage() {
  const [summary, assets] = await Promise.all([getModuleSummary(), listMediaAssets({ limit: 100 })]);
  return (
    <div className="space-y-6">
      <PageHeader title="Global Media Library" description="Moderate provider-uploaded media before it reaches public provider, service, and staff pages." />
      <div className="grid gap-4 md:grid-cols-3"><Card><CardContent><div className="text-sm font-bold text-slate-950">Assets</div><p className="mt-1 text-2xl font-bold">{summary.assetsCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Pending</div><p className="mt-1 text-2xl font-bold">{summary.pendingCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Approved</div><p className="mt-1 text-2xl font-bold">{summary.approvedCount}</p></CardContent></Card></div>
      <Card>
        <CardHeader><CardTitle>Media moderation queue</CardTitle></CardHeader>
        <CardContent>{assets.length ? <div className="space-y-3">{assets.map((asset) => <div key={asset.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><div className="font-semibold">{asset.originalName}</div><div className="font-mono text-xs text-muted-foreground">{asset.id}</div><div className="mt-1 truncate text-xs text-muted-foreground">{asset.fileUrl}</div><div className="mt-1 text-xs text-muted-foreground">{asset.mediaKind} · {asset.mimeType} · {formatDateTime(asset.createdAt)}</div></div><Badge variant={statusVariant(asset.moderationStatus)}>{asset.moderationStatus}</Badge></div><form action={reviewMediaAssetAction} className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]"><input type="hidden" name="mediaAssetId" value={asset.id} /><Field label="Decision"><Select name="decision" defaultValue="approved"><option value="approved">Approve</option><option value="rejected">Reject</option><option value="hidden">Hide</option></Select></Field><Field label="Reason"><Input name="reason" /></Field><div className="flex items-end"><Button type="submit" className="w-full">Apply</Button></div></form></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No media assets yet.</p>}</CardContent>
      </Card>
    </div>
  );
}
