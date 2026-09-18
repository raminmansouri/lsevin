import "server-only";

import db from "@/config/database/db";

import { isMonthDue } from "../lib/due-months";
import type {
  GymMembership,
  GymMembershipMonth,
  GymMembershipMonthAdminRow,
  GymMembershipMonthListFilters,
  GymMembershipMonthListResult,
  GymMembershipPlan,
  GymMembershipsAdminPageData,
  MembershipMonthStatus,
} from "../types";

type Locale = string;

export async function gymMembershipSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('gym.membership_plans') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function toFirstOfMonth(yearMonth: string): string {
  // yearMonth is already validated as /^\d{4}-\d{2}$/ by SubmitMembershipMonthsSchema.
  return `${yearMonth}-01`;
}

function mapPlanRow(row: any, locale: Locale): GymMembershipPlan {
  return {
    id: row.id,
    serviceProviderId: row.service_provider_id,
    providerName: row.provider_name || "",
    nameTranslations: row.name_translations || {},
    name: row.name_translations?.[locale] || row.name_translations?.["fa-IR"] || Object.values(row.name_translations || {})[0] || "",
    monthlyPrice: Number(row.monthly_price ?? 0),
    currency: row.currency,
    isActive: row.is_active,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

// ---------------------------------------------------------------------------
// Plans (admin: "admin can define those gyms['] [plans]")
// ---------------------------------------------------------------------------

export async function listMembershipPlans(locale: Locale, opts: { activeOnly?: boolean; serviceProviderId?: string } = {}): Promise<GymMembershipPlan[]> {
  const { activeOnly = false, serviceProviderId } = opts;
  const rows = await db<any[]>`
    select p.id, p.service_provider_id, p.name_translations, p.monthly_price, p.currency, p.is_active,
           p.create_date, p.last_modified_date,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name
    from gym.membership_plans p
    join category.service_providers sp on sp.id = p.service_provider_id
    where (${activeOnly} = false or p.is_active = true)
      and (${serviceProviderId ?? null}::uuid is null or p.service_provider_id = ${serviceProviderId ?? null}::uuid)
    order by p.create_date desc
  `;
  return rows.map((row) => mapPlanRow(row, locale));
}

export async function getMembershipPlan(id: string, locale: Locale): Promise<GymMembershipPlan | null> {
  const rows = await db<any[]>`
    select p.id, p.service_provider_id, p.name_translations, p.monthly_price, p.currency, p.is_active,
           p.create_date, p.last_modified_date,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name
    from gym.membership_plans p
    join category.service_providers sp on sp.id = p.service_provider_id
    where p.id = ${id}
  `;
  return rows[0] ? mapPlanRow(rows[0], locale) : null;
}

export async function upsertMembershipPlan(input: {
  id?: string;
  serviceProviderId: string;
  nameTranslations: Record<string, string>;
  monthlyPrice: number;
  currency: string;
  isActive: boolean;
}): Promise<{ id: string }> {
  if (input.id) {
    const rows = await db<{ id: string }[]>`
      update gym.membership_plans
      set name_translations = ${JSON.stringify(input.nameTranslations)}::jsonb,
          monthly_price = ${input.monthlyPrice},
          currency = ${input.currency},
          is_active = ${input.isActive},
          last_modified_date = now()
      where id = ${input.id}
      returning id
    `;
    if (!rows[0]) throw new Error("PLAN_NOT_FOUND");
    return rows[0];
  }
  const rows = await db<{ id: string }[]>`
    insert into gym.membership_plans (service_provider_id, name_translations, monthly_price, currency, is_active)
    values (${input.serviceProviderId}, ${JSON.stringify(input.nameTranslations)}::jsonb, ${input.monthlyPrice}, ${input.currency}, ${input.isActive})
    returning id
  `;
  return rows[0];
}

// ---------------------------------------------------------------------------
// Memberships & months (customer: subscribe, pay months, view own subscriptions)
// ---------------------------------------------------------------------------

function mapMonthRow(row: any): GymMembershipMonth {
  const periodMonth = row.period_month instanceof Date ? row.period_month.toISOString().slice(0, 10) : String(row.period_month);
  return {
    id: row.id,
    membershipId: row.membership_id,
    periodMonth,
    amount: Number(row.amount ?? 0),
    currency: row.currency,
    status: row.status,
    paymentReference: row.payment_reference,
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.create_date,
    isDue: isMonthDue(periodMonth, row.status),
  };
}

/** Finds the customer's existing active membership for this plan, or starts one --
 * "selecting a month and pay subscription" always needs a membership row to hang the
 * paid/due months off of, but nothing should be created (or charged) before the
 * customer actually submits a month to pay. */
async function getOrCreateActiveMembership(userId: string, membershipPlanId: string): Promise<{ id: string; serviceProviderId: string; monthlyPrice: number; currency: string }> {
  const plan = await db<{ id: string; service_provider_id: string; monthly_price: string; currency: string; is_active: boolean }[]>`
    select id, service_provider_id, monthly_price, currency, is_active from gym.membership_plans where id = ${membershipPlanId}
  `;
  if (!plan[0] || !plan[0].is_active) throw new Error("PLAN_NOT_FOUND");

  const existing = await db<{ id: string }[]>`
    select id from gym.memberships where user_id = ${userId} and membership_plan_id = ${membershipPlanId} and status = 'active'
  `;
  if (existing[0]) {
    return { id: existing[0].id, serviceProviderId: plan[0].service_provider_id, monthlyPrice: Number(plan[0].monthly_price), currency: plan[0].currency };
  }

  const created = await db<{ id: string }[]>`
    insert into gym.memberships (user_id, membership_plan_id, service_provider_id, status)
    values (${userId}, ${membershipPlanId}, ${plan[0].service_provider_id}, 'active')
    returning id
  `;
  return { id: created[0].id, serviceProviderId: plan[0].service_provider_id, monthlyPrice: Number(plan[0].monthly_price), currency: plan[0].currency };
}

export type SubmitMembershipMonthsOutcome = { membershipId: string; created: number; alreadyPaid: string[]; alreadyPending: string[] };

/** Item 4.1/4.2: "selecting a month and pay subscription" + "being able to pay 12 months" --
 * each requested month becomes its own pending_review row at the plan's current monthly
 * price; a month already `approved` is left untouched (never double-charged), a month
 * already `pending_review` is left untouched (no duplicate review item), and a previously
 * `rejected` month is reset back to pending_review so the customer can retry it. */
export async function submitMembershipMonths(userId: string, membershipPlanId: string, periodMonths: string[], paymentReference?: string): Promise<SubmitMembershipMonthsOutcome> {
  const membership = await getOrCreateActiveMembership(userId, membershipPlanId);
  let created = 0;
  const alreadyPaid: string[] = [];
  const alreadyPending: string[] = [];

  for (const yearMonth of periodMonths) {
    const periodMonth = toFirstOfMonth(yearMonth);
    const existing = await db<{ status: MembershipMonthStatus }[]>`
      select status from gym.membership_months where membership_id = ${membership.id} and period_month = ${periodMonth}::date
    `;
    if (existing[0]?.status === "approved") { alreadyPaid.push(yearMonth); continue; }
    if (existing[0]?.status === "pending_review") { alreadyPending.push(yearMonth); continue; }
    if (existing[0]) {
      // Previously rejected -- resubmitting clears the old review.
      await db`
        update gym.membership_months
        set status = 'pending_review', payment_reference = ${paymentReference ?? null}, review_note = null,
            reviewed_by = null, reviewed_at = null, last_modified_date = now()
        where membership_id = ${membership.id} and period_month = ${periodMonth}::date
      `;
    } else {
      await db`
        insert into gym.membership_months (membership_id, period_month, amount, currency, status, payment_reference)
        values (${membership.id}, ${periodMonth}::date, ${membership.monthlyPrice}, ${membership.currency}, 'pending_review', ${paymentReference ?? null})
      `;
    }
    created += 1;
  }

  return { membershipId: membership.id, created, alreadyPaid, alreadyPending };
}

/** Item 4.4: "seeing those subscriptions in his account". */
export async function listMyMemberships(userId: string, locale: Locale): Promise<GymMembership[]> {
  const memberships = await db<any[]>`
    select m.id, m.user_id, m.membership_plan_id, m.service_provider_id, m.status, m.create_date,
           p.monthly_price, p.currency, p.name_translations,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name
    from gym.memberships m
    join gym.membership_plans p on p.id = m.membership_plan_id
    join category.service_providers sp on sp.id = m.service_provider_id
    where m.user_id = ${userId}
    order by m.create_date desc
  `;
  if (memberships.length === 0) return [];

  const membershipIds = memberships.map((row) => row.id);
  const months = await db<any[]>`
    select id, membership_id, period_month, amount, currency, status, payment_reference,
           review_note, reviewed_by, reviewed_at, create_date
    from gym.membership_months
    where membership_id = any(${membershipIds})
    order by period_month asc
  `;
  const monthsByMembership = new Map<string, GymMembershipMonth[]>();
  for (const row of months) {
    const list = monthsByMembership.get(row.membership_id) ?? [];
    list.push(mapMonthRow(row));
    monthsByMembership.set(row.membership_id, list);
  }

  return memberships.map((row) => ({
    id: row.id,
    userId: row.user_id,
    membershipPlanId: row.membership_plan_id,
    serviceProviderId: row.service_provider_id,
    providerName: row.provider_name || "",
    planName: row.name_translations?.[locale] || row.name_translations?.["fa-IR"] || Object.values(row.name_translations || {})[0] || "",
    monthlyPrice: Number(row.monthly_price ?? 0),
    currency: row.currency,
    status: row.status,
    createdAt: row.create_date,
    months: monthsByMembership.get(row.id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Admin: review queue + "admin can see subscriptions"
// ---------------------------------------------------------------------------

/** Item 4.6: mirrors shop's reviewReturnRequest convention exactly -- a decision of
 * approved/rejected, a note mandatory only to reject (enforced again here, not just in the
 * zod schema, since this function is the actual trust boundary). */
export async function reviewMembershipMonth(input: { id: string; decision: "approved" | "rejected"; note?: string; actorUserId: string | null }): Promise<boolean> {
  if (input.decision === "rejected" && !input.note?.trim()) throw new Error("A reason is required to reject a payment.");
  const rows = await db<{ id: string }[]>`
    update gym.membership_months
    set status = ${input.decision}, review_note = ${input.note?.trim() || null},
        reviewed_by = ${input.actorUserId}, reviewed_at = now(), last_modified_date = now()
    where id = ${input.id} and status = 'pending_review'
    returning id
  `;
  return Boolean(rows[0]);
}

/** Item 4.7: "admin can see subscriptions" -- every month, across every membership, with the
 * customer/gym/plan context flattened in (same shape the review queue and a general overview
 * both need, filtered by status when the caller only wants the pending queue). */
export async function listMembershipMonthsForAdmin(filters: GymMembershipMonthListFilters, locale: Locale): Promise<GymMembershipMonthListResult> {
  const { status, search, pageNumber, pageSize } = filters;
  const offset = (pageNumber - 1) * pageSize;
  const like = `%${search}%`;

  const rows = await db<any[]>`
    select mm.id, mm.membership_id, mm.period_month, mm.amount, mm.currency, mm.status,
           mm.payment_reference, mm.review_note, mm.reviewed_by, mm.reviewed_at, mm.create_date,
           m.user_id, m.membership_plan_id,
           p.name_translations as plan_name_translations,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
           count(*) over () as total_count
    from gym.membership_months mm
    join gym.memberships m on m.id = mm.membership_id
    join gym.membership_plans p on p.id = m.membership_plan_id
    join category.service_providers sp on sp.id = m.service_provider_id
    where (${status}::text = 'all' or mm.status = ${status})
      and (
        ${search}::text = ''
        or common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') ilike ${like}
        or mm.payment_reference ilike ${like}
      )
    order by
      case when mm.status = 'pending_review' then 0 else 1 end,
      mm.create_date desc
    limit ${pageSize} offset ${offset}
  `;

  const totalCount = Number(rows[0]?.total_count ?? 0);
  const items: GymMembershipMonthAdminRow[] = rows.map((row) => ({
    ...mapMonthRow(row),
    userId: row.user_id,
    providerName: row.provider_name || "",
    planName: row.plan_name_translations?.[locale] || row.plan_name_translations?.["fa-IR"] || Object.values(row.plan_name_translations || {})[0] || "",
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPrevious: pageNumber > 1,
    hasNext: pageNumber < totalPages,
  };
}

// ---------------------------------------------------------------------------
// Admin page composition
// ---------------------------------------------------------------------------

export async function getGymMembershipsAdminPageData(filters: GymMembershipMonthListFilters, locale: Locale): Promise<GymMembershipsAdminPageData> {
  if (!(await gymMembershipSchemaExists())) {
    return {
      plans: [],
      months: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: filters.pageSize,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
      filters,
      schemaMissing: true,
    };
  }

  const [plans, months] = await Promise.all([
    listMembershipPlans(locale),
    listMembershipMonthsForAdmin(filters, locale),
  ]);

  return { plans, months, filters, schemaMissing: false };
}
