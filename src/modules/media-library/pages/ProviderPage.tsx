import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { LocalizedField } from "@core/ui/LocalizedField";
import { MediaPicker } from "@core/ui/MediaPicker";
import { formatDateTime } from "@core/lib/format";
import { createAndAttachMediaAction, setMediaPrimaryAction } from "../actions";
import { getModuleSummary, listMediaUsages } from "../repository";

function statusVariant(status: string) {
  if (["approved"].includes(status)) return "success" as const;
  if (["rejected", "hidden"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, usages] = await Promise.all([getModuleSummary(providerId), listMediaUsages(providerId)]);
  return (
    <div className="space-y-6">
      <PageHeader title="Provider Media Library" description="Upload/register media, localize alt text, attach to provider/service/staff pages, set primary image, and keep public visibility behind approval." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Media assets</div><p className="mt-1 text-2xl font-bold">{summary.assetsCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Pending approval</div><p className="mt-1 text-2xl font-bold">{summary.pendingCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Approved</div><p className="mt-1 text-2xl font-bold">{summary.approvedCount}</p></CardContent></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader><CardTitle>Attached media</CardTitle></CardHeader>
          <CardContent>{usages.length ? <div className="grid gap-3 md:grid-cols-2">{usages.map((item) => <div key={item.usageId} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{item.originalName}</div><div className="text-xs text-muted-foreground">{item.ownerEntityType} · {item.usageKind} · order {item.displayOrder}</div></div><Badge variant={statusVariant(item.moderationStatus)}>{item.moderationStatus}</Badge></div><div className="mt-2 truncate text-xs text-muted-foreground">{item.fileUrl}</div><div className="mt-2 flex items-center justify-between"><Badge variant={item.isPrimary ? "success" : "neutral"}>{item.isPrimary ? "primary" : "secondary"}</Badge><span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span></div><form action={setMediaPrimaryAction} className="mt-3"><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="usageId" value={item.usageId} /><Button type="submit" variant="secondary" className="w-full">Set primary</Button></form></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No media attached yet.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Add media</CardTitle></CardHeader>
          <CardContent>
            <form action={createAndAttachMediaAction} className="space-y-3">
              <input type="hidden" name="providerId" value={providerId} />
              <MediaPicker name="mediaReference" providerId={providerId} mediaType="all" valueField="id" label="Provider-owned media" required />
              <Field label="Attach to"><Select name="ownerEntityType" defaultValue="provider"><option value="provider">Provider</option><option value="service">Service</option><option value="staff">Staff</option></Select></Field>
              <Field label="Entity ID"><Input name="ownerEntityId" defaultValue={providerId} /></Field>
              <Field label="Usage"><Select name="usageKind" defaultValue="gallery"><option value="gallery">Gallery</option><option value="hero">Hero</option><option value="primary_card">Primary card</option><option value="certificate">Certificate</option></Select></Field>
              <Field label="Display order"><Input name="displayOrder" type="number" defaultValue="0" /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPrimary" /> Set as primary after approval</label>
              <LocalizedField name="title" label="Media title" />
              <LocalizedField name="alt" label="Alternative text" mode="textarea" help="Describe the media in every language used on the public page." />
              <Button type="submit" className="w-full">Submit media for approval</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
