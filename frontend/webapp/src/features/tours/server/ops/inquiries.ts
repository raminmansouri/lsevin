import "server-only";

import db from "@/config/database/db";

import { isIsoDate } from "../../domain/calendar";
import { fail, mapDbError } from "../platform/errors";
import { requireProviderRole, type Actor } from "../platform/roles";

import { auditOps, iso, isoDateOf, notifyUser, requireUuid, scopeFor, type Tx } from "./common";

/** Private / group quote requests (C-101, V-035). */

export type InquiryInput = { tourId: string; kind: "private_quote" | "group"; partySize: number; preferredDates?: string[]; message?: string };

export async function createInquiry(userId: string, input: InquiryInput): Promise<{ id: string }> {
  if (!userId) throw fail.auth();
  requireUuid(input.tourId, "tour_not_found");
  if (!["private_quote", "group"].includes(input.kind)) throw fail.validation("invalid_kind");
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 500) throw fail.validation("invalid_party_size");
  const dates = input.preferredDates ?? [];
  if (!Array.isArray(dates) || dates.length > 10 || dates.some((d) => !isIsoDate(d))) throw fail.validation("invalid_dates");
  const message = String(input.message ?? "").trim();
  if (message.length > 2000) throw fail.validation("message_too_long");
  const [t] = await db<any[]>`select status, service_provider_id::text from tour.tours where id = ${input.tourId}::uuid`;
  if (!t || t.status !== "published") throw fail.notFound("tour_not_found");
  const [open] = await db<any[]>`select count(*)::int as n from tour.inquiries where user_id = ${userId}::uuid and tour_id = ${input.tourId}::uuid and status in ('open','quoted')`;
  if (open.n >= 3) throw fail.conflict("too_many_open_inquiries");
  try {
    return await db.begin(async (tx) => {
      const [r] = await tx<any[]>`
        insert into tour.inquiries (tour_id, user_id, kind, party_size, preferred_dates, message)
        values (${input.tourId}::uuid, ${userId}::uuid, ${input.kind}, ${input.partySize}, ${dates}::date[], ${message})
        returning id::text`;
      await auditOps(tx as unknown as Tx, { userId }, "customer", t.service_provider_id, "inquiry", r.id, "inquiry_created", { kind: input.kind, partySize: input.partySize });
      return { id: r.id as string };
    });
  } catch (e) {
    throw mapDbError(e, "createInquiry");
  }
}

function mapInquiry(r: any) {
  return {
    id: r.id, tourId: r.tour_id, tourTitle: r.title ?? null, kind: r.kind, partySize: r.party_size,
    preferredDates: (r.preferred_dates ?? []).map((d: unknown) => isoDateOf(d)), message: r.message, status: r.status,
    quoteAmount: r.quote_amount == null ? null : Number(r.quote_amount), quoteCurrency: r.quote_currency, quoteExpiresAt: iso(r.quote_expires_at),
    providerReply: r.provider_reply, createdAt: iso(r.created_at)!, updatedAt: iso(r.updated_at)!,
  };
}

export async function listProviderInquiries(actor: Actor, serviceProviderId: string) {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "staff");
  // Lapse quotes past their validity before listing.
  await db`update tour.inquiries i set status = 'expired', updated_at = now() from tour.tours t
            where t.id = i.tour_id and t.service_provider_id = ${serviceProviderId}::uuid and i.status = 'quoted' and i.quote_expires_at <= now()`;
  const rows = await db<any[]>`
    select i.*, i.id::text as id, i.tour_id::text as tour_id,
           (select coalesce(c.published_value, c.draft_value) from tour.content c
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title
      from tour.inquiries i join tour.tours t on t.id = i.tour_id
     where t.service_provider_id = ${serviceProviderId}::uuid
     order by case i.status when 'open' then 0 when 'quoted' then 1 else 2 end, i.created_at desc limit 300`;
  return rows.map(mapInquiry);
}

export async function listMyInquiries(userId: string) {
  const rows = await db<any[]>`select *, id::text as id, tour_id::text as tour_id from tour.inquiries where user_id = ${userId}::uuid order by created_at desc limit 100`;
  return rows.map(mapInquiry);
}

async function inquiryOwner(inquiryId: string) {
  requireUuid(inquiryId, "inquiry_not_found");
  const [r] = await db<any[]>`select i.status, i.user_id::text, t.service_provider_id::text from tour.inquiries i join tour.tours t on t.id = i.tour_id where i.id = ${inquiryId}::uuid`;
  if (!r) throw fail.notFound("inquiry_not_found");
  return r as { status: string; user_id: string; service_provider_id: string };
}

export async function quoteInquiry(actor: Actor, inquiryId: string, input: { amount: number; currency: string; expiresAt: string; reply?: string | null }): Promise<void> {
  const inq = await inquiryOwner(inquiryId);
  await requireProviderRole(actor, inq.service_provider_id, "staff");
  if (!["open", "quoted"].includes(inq.status)) throw fail.conflict("inquiry_closed");
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1e15) throw fail.validation("invalid_amount");
  const expires = new Date(String(input.expiresAt));
  if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) throw fail.validation("invalid_expiry");
  const reply = String(input.reply ?? "").trim();
  if (reply.length > 2000) throw fail.validation("reply_too_long");
  const [cur] = await db`select 1 from finance.currencies where code = ${input.currency} and is_active`;
  if (!cur) throw fail.validation("invalid_currency");
  await db.begin(async (tx) => {
    const r = await tx`update tour.inquiries set status = 'quoted', quote_amount = ${input.amount}, quote_currency = ${input.currency},
                              quote_expires_at = ${expires}, provider_reply = ${reply || null}, updated_at = now()
                        where id = ${inquiryId}::uuid and status in ('open','quoted') returning id`;
    if (r.length === 0) throw fail.conflict("inquiry_closed");
    await auditOps(tx as unknown as Tx, actor, scopeFor(actor, inq.service_provider_id), inq.service_provider_id, "inquiry", inquiryId, "inquiry_quoted", { amount: input.amount, currency: input.currency });
  });
  await notifyUser({ userId: inq.user_id, type: "booking", title: "Your quote is ready", body: `The operator sent a quote: ${input.amount} ${input.currency}.`, entityType: "tour_inquiry", entityId: inquiryId, data: { kind: "inquiry_quoted" } });
}

export async function declineInquiry(actor: Actor, inquiryId: string, reply?: string | null): Promise<void> {
  const inq = await inquiryOwner(inquiryId);
  await requireProviderRole(actor, inq.service_provider_id, "staff");
  if (!["open", "quoted"].includes(inq.status)) throw fail.conflict("inquiry_closed");
  const text = String(reply ?? "").trim().slice(0, 2000);
  await db.begin(async (tx) => {
    await tx`update tour.inquiries set status = 'declined', provider_reply = ${text || null}, updated_at = now() where id = ${inquiryId}::uuid`;
    await auditOps(tx as unknown as Tx, actor, scopeFor(actor, inq.service_provider_id), inq.service_provider_id, "inquiry", inquiryId, "inquiry_declined", {});
  });
  await notifyUser({ userId: inq.user_id, type: "booking", title: "Inquiry declined", body: "The operator could not offer this request.", entityType: "tour_inquiry", entityId: inquiryId, data: { kind: "inquiry_declined" } });
}
