import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { formatDateTime } from "@core/lib/format";
import { PageHeader } from "@core/ui/PageHeader";
import { markInboxReadAction } from "../actions";
import { getModuleSummary, listInbox } from "../repository";

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, inbox] = await Promise.all([getModuleSummary(providerId), listInbox(providerId, 50)]);
  return (
    <div className="space-y-6">
      <PageHeader title="Provider Notifications" description="Operational inbox for claim, payment, booking, review, ticket, and content updates." />
      <div className="grid gap-4 md:grid-cols-3"><Card><CardContent><div className="text-sm font-bold text-slate-950">Inbox items</div><p className="mt-1 text-2xl font-bold">{inbox.length}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Unread</div><p className="mt-1 text-2xl font-bold">{summary.unreadCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Templates active</div><p className="mt-1 text-2xl font-bold">{summary.activeTemplatesCount}</p></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Inbox</CardTitle></CardHeader><CardContent>{inbox.length ? <div className="space-y-3">{inbox.map((item) => <div key={item.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold" data-user-content>{item.title}</div><div className="text-xs text-muted-foreground">{item.sourceModule || "system"} · {formatDateTime(item.createdAt)}</div></div><Badge variant={item.readAt ? "neutral" : "warning"}>{item.readAt ? "read" : "unread"}</Badge></div><p className="mt-2 text-muted-foreground" data-user-content>{item.body}</p>{!item.readAt ? <form action={markInboxReadAction} className="mt-3"><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="inboxItemId" value={item.id} /><Button type="submit" variant="secondary">Mark read</Button></form> : null}</div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No notifications yet.</p>}</CardContent></Card>
    </div>
  );
}
