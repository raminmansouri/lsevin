import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { getPortalLocale } from "@core/i18n/server";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { markStaffInboxReadAction } from "../actions";
import { notificationsCopy } from "../i18n";
import { listRecipientInbox } from "../repository";

export async function StaffNotificationsPage({ params }: { params: Record<string,string> }) {
  const user = await requireCurrentUser();
  const staffId = params.staffId;
  await requireStaffProfilePermission(user.id,staffId,"viewOwnBookings");
  const locale = await getPortalLocale();
  const t = notificationsCopy(locale.header);
  const [userInbox, staffInbox] = await Promise.all([listRecipientInbox("user", user.id, 75), listRecipientInbox("staff", staffId, 75)]);
  const inbox = [...userInbox, ...staffInbox].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 75);
  return <div className="space-y-6">
    <PageHeader title={t.title} description={t.description}/>
    <Card><CardHeader><CardTitle>{t.inbox}</CardTitle></CardHeader><CardContent>
      {inbox.length ? <div className="space-y-3">{inbox.map((item)=><div key={item.id} className="rounded-lg border border-border p-3 text-sm">
        <div className="flex items-start justify-between gap-3"><div><div className="font-semibold" data-user-content>{item.title}</div><div className="text-xs text-muted-foreground">{item.sourceModule || "system"} · {formatDateTime(item.createdAt)}</div></div><Badge variant={item.readAt?"neutral":"warning"}>{item.readAt?t.read:t.unread}</Badge></div>
        <p className="mt-2 text-muted-foreground" data-user-content>{item.body}</p>
        {!item.readAt?<form action={markStaffInboxReadAction} className="mt-3"><input type="hidden" name="staffId" value={staffId}/><input type="hidden" name="inboxItemId" value={item.id}/><input type="hidden" name="recipientEntityType" value={item.recipientEntityType}/><Button type="submit" variant="secondary">{t.markRead}</Button></form>:null}
      </div>)}</div>:<p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{t.empty}</p>}
    </CardContent></Card>
  </div>;
}
