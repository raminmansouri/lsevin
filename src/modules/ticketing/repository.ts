import "server-only";
import { sql } from "@core/db/client";

export type ModuleRecord = { id: string; status?: string | null; type?: string | null; createdAt?: string | null };
export type TicketItem = {
  id: string;
  serviceProviderId: string | null;
  department: string;
  subject: string;
  status: string;
  priority: string;
  assignedToUserId: string | null;
  unreadForProviderCount: number;
  unreadForAdminCount: number;
  messagesCount: number;
  firstResponseDueAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type TicketMessageItem = {
  id: string;
  ticketId: string;
  senderRole: string;
  body: string;
  isInternalNote: boolean;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
};

export async function getModuleSummary(providerId?: string) {
  const tickets = await listTickets({ providerId, limit: 100 });
  return {
    recordCount: tickets.length,
    providerId: providerId ?? null,
    openCount: tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status)).length,
    urgentCount: tickets.filter((ticket) => ["high", "urgent"].includes(ticket.priority)).length,
    unreadCount: tickets.reduce((sum, ticket) => sum + (providerId ? ticket.unreadForProviderCount : ticket.unreadForAdminCount), 0),
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select id::text as id, status, department as type, created_at::text as "createdAt"
        from ticketing.tickets
        where service_provider_id = ${providerId}::uuid
        order by created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, status, department as type, created_at::text as "createdAt"
      from ticketing.tickets
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listTickets(input: { providerId?: string; limit?: number } = {}): Promise<TicketItem[]> {
  const limit = input.limit ?? 50;
  try {
    if (input.providerId) {
      return sql<TicketItem[]>`
        select ${ticketSelectFragment()}
        from ticketing.tickets t
        left join lateral (select count(*)::int as messages_count from ticketing.ticket_messages m where m.ticket_id = t.id) messages on true
        where t.service_provider_id = ${input.providerId}::uuid
        order by t.updated_at desc
        limit ${limit}
      `;
    }
    return sql<TicketItem[]>`
      select ${ticketSelectFragment()}
      from ticketing.tickets t
      left join lateral (select count(*)::int as messages_count from ticketing.ticket_messages m where m.ticket_id = t.id) messages on true
      order by t.updated_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

function ticketSelectFragment() {
  return sql`
    t.id::text as id,
    t.service_provider_id::text as "serviceProviderId",
    t.department,
    t.subject,
    t.status,
    t.priority,
    t.assigned_to_user_id::text as "assignedToUserId",
    t.unread_for_provider_count::int as "unreadForProviderCount",
    t.unread_for_admin_count::int as "unreadForAdminCount",
    coalesce(messages.messages_count, 0)::int as "messagesCount",
    t.first_response_due_at::text as "firstResponseDueAt",
    t.created_at::text as "createdAt",
    t.updated_at::text as "updatedAt"
  `;
}

export async function listTicketMessages(ticketId: string, limit = 50): Promise<TicketMessageItem[]> {
  try {
    return sql<TicketMessageItem[]>`
      select id::text as id, ticket_id::text as "ticketId", sender_role as "senderRole", body, is_internal_note as "isInternalNote", attachment_url as "attachmentUrl", attachment_name as "attachmentName", created_at::text as "createdAt"
      from ticketing.ticket_messages
      where ticket_id = ${ticketId}::uuid
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function createTicket(input: { providerId: string; createdByUserId: string; subject: string; body: string; priority: string; department: string; attachmentUrl?: string; attachmentName?: string }) {
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`
      insert into ticketing.tickets(service_provider_id, created_by_user_id, department, subject, priority, status, unread_for_admin_count, first_response_due_at)
      values (${input.providerId}::uuid, ${input.createdByUserId}::uuid, ${input.department}, ${input.subject}, ${input.priority}, 'open', 1, now() + interval '24 hours')
      returning id::text
    `;
    const ticketId = rows[0].id;
    await tx`
      insert into ticketing.ticket_messages(ticket_id, sender_user_id, sender_role, body, is_internal_note, attachment_url, attachment_name)
      values (${ticketId}::uuid, ${input.createdByUserId}::uuid, 'provider', ${input.body}, false, nullif(${input.attachmentUrl || ""}, ''), nullif(${input.attachmentName || ""}, ''))
    `;
    return ticketId;
  });
}

export async function replyTicket(input: { ticketId: string; senderUserId: string; senderRole: "provider" | "lsevin_admin"; body: string; isInternalNote?: boolean; attachmentUrl?: string; attachmentName?: string }) {
  return sql.begin(async (tx) => {
    const tickets = await tx<{ providerId: string }[]>`select service_provider_id::text as "providerId" from ticketing.tickets where id = ${input.ticketId}::uuid limit 1`;
    const providerId = tickets[0]?.providerId;
    if (!providerId) throw new Error("Support ticket not found.");
    await tx`
      insert into ticketing.ticket_messages(ticket_id, sender_user_id, sender_role, body, is_internal_note, attachment_url, attachment_name)
      values (${input.ticketId}::uuid, ${input.senderUserId}::uuid, ${input.senderRole}, ${input.body}, ${input.isInternalNote ?? false}, nullif(${input.attachmentUrl || ""}, ''), nullif(${input.attachmentName || ""}, ''))
    `;
    if (input.senderRole === "provider") {
      await tx`
        update ticketing.tickets set unread_for_admin_count = unread_for_admin_count + 1, status = case when status = 'closed' then 'open' else status end, updated_at = now()
        where id = ${input.ticketId}::uuid
      `;
    } else {
      await tx`
        update ticketing.tickets set unread_for_provider_count = unread_for_provider_count + 1, status = case when status = 'open' then 'waiting_provider' else status end, updated_at = now()
        where id = ${input.ticketId}::uuid
      `;
    }
    return providerId;
  });
}

export async function updateTicketAdminState(input: { ticketId: string; assignedToUserId?: string; status: string; priority: string }) {
  const closed = ["resolved", "closed"].includes(input.status);
  await sql`
    update ticketing.tickets
    set assigned_to_user_id = nullif(${input.assignedToUserId || ""}, '')::uuid,
        status = ${input.status},
        priority = ${input.priority},
        resolved_at = case when ${closed} then coalesce(resolved_at, now()) else resolved_at end,
        updated_at = now()
    where id = ${input.ticketId}::uuid
  `;
}
