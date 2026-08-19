import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { createTicketAction, replyTicketAction } from "../actions";
import { getModuleSummary, listTickets } from "../repository";

function statusVariant(status: string) {
  if (["resolved", "closed"].includes(status)) return "success" as const;
  if (["urgent", "high"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, tickets] = await Promise.all([getModuleSummary(providerId), listTickets({ providerId, limit: 50 })]);
  const firstTicket = tickets[0];
  return (
    <div className="space-y-6">
      <PageHeader title="Provider Tickets" description="Provider–LSevin support conversation trail with priority, attachments, unread counts, and SLA visibility." />
      <div className="grid gap-4 md:grid-cols-4"><Card><CardContent><div className="text-sm font-bold text-slate-950">Tickets</div><p className="mt-1 text-2xl font-bold">{tickets.length}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Open</div><p className="mt-1 text-2xl font-bold">{summary.openCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Urgent/high</div><p className="mt-1 text-2xl font-bold">{summary.urgentCount}</p></CardContent></Card><Card><CardContent><div className="text-sm font-bold text-slate-950">Unread</div><p className="mt-1 text-2xl font-bold">{summary.unreadCount}</p></CardContent></Card></div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader><CardTitle>Ticket history</CardTitle></CardHeader><CardContent>{tickets.length ? <div className="space-y-3">{tickets.map((ticket) => <div key={ticket.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold" data-user-content>{ticket.subject}</div><div className="font-mono text-xs text-muted-foreground">{ticket.id}</div><div className="text-xs text-muted-foreground">{ticket.department} · {formatDateTime(ticket.updatedAt)}</div></div><div className="text-right"><Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge><div className="mt-1"><Badge variant={statusVariant(ticket.priority)}>{ticket.priority}</Badge></div></div></div><div className="mt-2 text-xs text-muted-foreground">Messages {ticket.messagesCount} · unread {ticket.unreadForProviderCount} · SLA {formatDateTime(ticket.firstResponseDueAt)}</div></div>)}</div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No tickets yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Open / reply</CardTitle></CardHeader><CardContent className="space-y-5"><form action={createTicketAction} className="space-y-3"><input type="hidden" name="providerId" value={providerId} /><Field label="Subject"><Input name="subject" required /></Field><Field label="Department"><Select name="department" defaultValue="support"><option value="support">Support</option><option value="billing">Billing</option><option value="content">Content</option><option value="booking">Booking</option></Select></Field><Field label="Priority"><Select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></Select></Field><Field label="Message"><Textarea name="body" required /></Field><Field label="Attachment URL"><Input name="attachmentUrl" /></Field><Button type="submit" className="w-full">Open ticket</Button></form><form action={replyTicketAction} className="space-y-3 border-t border-border pt-5"><input type="hidden" name="providerId" value={providerId} /><Field label="Ticket ID"><Input name="ticketId" defaultValue={firstTicket?.id ?? ""} required /></Field><Field label="Reply"><Textarea name="body" required /></Field><Field label="Attachment URL"><Input name="attachmentUrl" /></Field><Button type="submit" variant="secondary" className="w-full">Reply</Button></form></CardContent></Card>
      </div>
    </div>
  );
}
