import Link from "next/link";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { formatDateTime } from "@core/lib/format";
import { localizeReactTree } from "@core/i18n/localize-tree";
import { createSupportTicketAction, updateSupportTicketStatusAction } from "../actions";
import type { ProviderSupportTicket } from "../types";

export function SupportManager({ providerId, tickets, locale = "fa-IR", timeZone = "Asia/Tehran" }: { providerId: string; tickets: ProviderSupportTicket[]; locale?: string; timeZone?: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <TicketsList tickets={tickets} providerId={providerId} showProvider={false} locale={locale} timeZone={timeZone} />
      <TicketForm providerId={providerId} locale={locale} />
    </div>
  );
}

export function TicketsList({ tickets, providerId, showProvider = true, locale = "fa-IR", timeZone = "Asia/Tehran" }: { tickets: ProviderSupportTicket[]; providerId?: string; showProvider?: boolean; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Support tickets</CardTitle></CardHeader>
      <div className="divide-y divide-border">
        {tickets.length ? tickets.map((ticket) => (
          <div key={ticket.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="font-bold text-slate-950" data-user-content>{ticket.subject}</div>
              <div className="mt-1 text-xs text-muted-foreground">{showProvider ? `${ticket.providerName || "Provider"} · ` : ""}{formatDateTime(ticket.createdAt, locale, timeZone)} · {ticket.priority}</div>
              <p className="mt-2 text-sm leading-6 text-slate-700" data-user-content>{ticket.message}</p>
              {showProvider ? <Link href={`/providers/${ticket.serviceProviderId}/support`} className="mt-2 inline-block text-xs font-bold text-[#065f46]">Open provider support</Link> : null}
            </div>
            <form action={updateSupportTicketStatusAction} className="flex items-start gap-2">
              <input type="hidden" name="providerId" value={providerId || ticket.serviceProviderId} />
              <input type="hidden" name="ticketId" value={ticket.id} />
              <Select name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></Select>
              <Button type="submit" variant="secondary">Save</Button>
            </form>
          </div>
        )) : <div className="p-5 text-sm text-muted-foreground">No support tickets yet.</div>}
      </div>
    </Card>
  ), locale);
}

export function TicketForm({ providerId, locale = "fa-IR" }: { providerId: string; locale?: string }) {
  return localizeReactTree((
    <form action={createSupportTicketAction}>
      <input type="hidden" name="providerId" value={providerId} />
      <Card>
        <CardHeader><CardTitle>New ticket</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Subject"><Input name="subject" required /></Field>
          <Field label="Priority"><Select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></Select></Field>
          <Field label="Message"><Textarea name="message" required /></Field>
          <Button type="submit">Submit ticket</Button>
        </CardContent>
      </Card>
    </form>
    ), locale);
}
