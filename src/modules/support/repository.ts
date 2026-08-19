import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { ProviderSupportTicket } from "./types";

export async function listProviderTickets(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderSupportTicket[]>`
    select
      t.id::text,
      t.service_provider_id::text as "serviceProviderId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      t.subject,
      t.message,
      t.status::text,
      t.priority,
      t.create_date::text as "createdAt",
      t.last_modified_date::text as "lastModifiedDate"
    from provider_portal.support_tickets t
    join category.service_providers sp on sp.id = t.service_provider_id
    where t.service_provider_id = ${providerId}::uuid
    order by t.create_date desc
  `;
}

export async function listMyProviderTickets(userId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderSupportTicket[]>`
    select
      t.id::text,
      t.service_provider_id::text as "serviceProviderId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      t.subject,
      t.message,
      t.status::text,
      t.priority,
      t.create_date::text as "createdAt",
      t.last_modified_date::text as "lastModifiedDate"
    from provider_portal.support_tickets t
    join provider_portal.provider_members pm on pm.service_provider_id = t.service_provider_id
    join category.service_providers sp on sp.id = t.service_provider_id
    where pm.user_id = ${userId}::uuid
    order by t.create_date desc
    limit 100
  `;
}

export async function createSupportTicket(input: { providerId: string; userId: string; subject: string; message: string; priority: string }) {
  await sql`
    insert into provider_portal.support_tickets (service_provider_id, created_by_user_id, subject, message, priority, status, metadata, create_date, last_modified_date)
    values (${input.providerId}::uuid, ${input.userId}::uuid, ${input.subject}, ${input.message}, ${input.priority}, 'open', '{}'::jsonb, now(), now())
  `;
}

export async function updateSupportTicketStatus(input: { providerId: string; ticketId: string; status: string }) {
  await sql`
    update provider_portal.support_tickets set status = ${input.status}::provider_portal.ticket_status, last_modified_date = now()
    where id = ${input.ticketId}::uuid and service_provider_id = ${input.providerId}::uuid
  `;
}
