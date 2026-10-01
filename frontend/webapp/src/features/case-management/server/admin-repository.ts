import "server-only";

import { db } from "@/features/booking-admin-shared/server/db";

export type AdminCaseRow = {
  id: string;
  bookingId: string;
  status: "scheduled" | "active" | "on_hold" | "completed" | "cancelled";
  customerName: string | null;
  customerEmail: string | null;
  providerName: string;
  serviceName: string;
  staffName: string | null;
  currentStep: string | null;
  completedSteps: number;
  totalSteps: number;
  createdAt: string;
};

export type AdminCaseSummary = {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  onHold: number;
  cancelled: number;
};

export type AdminCaseDetail = AdminCaseRow & {
  steps: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    responsibleRole: string;
    plannedStartAt: string | null;
    plannedEndAt: string | null;
    completedAt: string | null;
    completionNote: string | null;
  }>;
};

export type ProcessTemplateRow = {
  id: string;
  name: string;
  scopeType: string;
  scopeName: string;
  version: number;
  isActive: boolean;
  stepCount: number;
};

export async function listProcessTemplates(locale: string): Promise<ProcessTemplateRow[]> {
  return db<ProcessTemplateRow[]>`
    select pt.id::text,
      coalesce(nullif(common.get_translation_t(pt.name_translations, ${locale}, 'fa-IR'), ''), '-') as name,
      pt.scope_type as "scopeType",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(cat.name_translations, ${locale}, 'fa-IR'), ''), '-'
      ) as "scopeName",
      pt.version, pt.is_active as "isActive", count(pts.id)::int as "stepCount"
    from case_management.process_templates pt
    left join category.provider_services ps on ps.id = pt.provider_service_id
    left join category.service_definitions sd on sd.id = pt.service_definition_id
    left join category.categories cat on cat.id = pt.category_id
    left join case_management.process_template_steps pts on pts.template_id = pt.id
    group by pt.id, ps.id, sd.id, cat.id
    order by pt.is_active desc, pt.last_modified_date desc
  `;
}

export async function getAdminCase(caseId: string, locale: string): Promise<AdminCaseDetail | null> {
  const rows = await db<Array<AdminCaseRow & { steps: AdminCaseDetail["steps"] }>>`
    select
      c.id::text, c.booking_id::text as "bookingId", c.status,
      nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "customerName",
      u.email as "customerEmail",
      coalesce(nullif(common.get_translation_t(p.name_translations, ${locale}, 'fa-IR'), ''), '-') as "providerName",
      coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), '-') as "serviceName",
      nullif(common.get_translation_t(st.name_translations, ${locale}, 'fa-IR'), '') as "staffName",
      coalesce(nullif(common.get_translation_t(current_step.title_translations, ${locale}, 'fa-IR'), ''), current_step.legacy_title, current_step.step_key) as "currentStep",
      count(case when cs.status in ('completed', 'skipped') then 1 end)::int as "completedSteps",
      count(cs.id)::int as "totalSteps", c.create_date::text as "createdAt",
      coalesce(jsonb_agg(jsonb_build_object(
        'id', cs.id::text,
        'title', coalesce(nullif(common.get_translation_t(cs.title_translations, ${locale}, 'fa-IR'), ''), cs.legacy_title, cs.step_key),
        'description', coalesce(nullif(common.get_translation_t(cs.description_translations, ${locale}, 'fa-IR'), ''), cs.legacy_description),
        'status', cs.status,
        'responsibleRole', cs.responsible_role,
        'plannedStartAt', cs.planned_start_at,
        'plannedEndAt', cs.planned_end_at,
        'completedAt', cs.completed_at,
        'completionNote', cs.completion_note
      ) order by cs.display_order) filter (where cs.id is not null), '[]'::jsonb) as steps
    from case_management.cases c
    left join identity.asp_net_users u on u.id = c.customer_user_id
    left join category.service_providers p on p.id = c.provider_id
    left join category.provider_services ps on ps.id = c.provider_service_id
    left join category.staff st on st.id = coalesce(c.assigned_staff_id, c.specialist_id)
    left join case_management.case_steps current_step on current_step.id = c.current_step_id
    left join case_management.case_steps cs on cs.case_id = c.id and cs.admin_visible
    where c.id = ${caseId}::uuid
    group by c.id, u.id, p.id, ps.id, st.id, current_step.id
  `;
  return rows[0] ?? null;
}

export async function listAdminCases(locale: string): Promise<{
  cases: AdminCaseRow[];
  summary: AdminCaseSummary;
}> {
  const [cases, [summary]] = await Promise.all([
    db<AdminCaseRow[]>`
      select
        c.id::text,
        c.booking_id::text as "bookingId",
        c.status,
        nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "customerName",
        u.email as "customerEmail",
        coalesce(nullif(common.get_translation_t(p.name_translations, ${locale}, 'fa-IR'), ''), '-') as "providerName",
        coalesce(
          nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
          nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''), '-'
        ) as "serviceName",
        nullif(common.get_translation_t(st.name_translations, ${locale}, 'fa-IR'), '') as "staffName",
        coalesce(
          nullif(common.get_translation_t(current_step.title_translations, ${locale}, 'fa-IR'), ''),
          current_step.legacy_title,
          current_step.step_key
        ) as "currentStep",
        count(case when steps.status in ('completed', 'skipped') then 1 end)::int as "completedSteps",
        count(steps.id)::int as "totalSteps",
        c.create_date::text as "createdAt"
      from case_management.cases c
      left join identity.asp_net_users u on u.id = c.customer_user_id
      left join category.service_providers p on p.id = c.provider_id
      left join category.provider_services ps on ps.id = c.provider_service_id
      left join category.service_definitions sd on sd.id = c.service_definition_id
      left join category.staff st on st.id = coalesce(c.assigned_staff_id, c.specialist_id)
      left join case_management.case_steps current_step on current_step.id = c.current_step_id
      left join case_management.case_steps steps on steps.case_id = c.id and steps.admin_visible
      group by c.id, u.id, p.id, ps.id, sd.id, st.id, current_step.id
      order by
        case c.status when 'active' then 0 when 'on_hold' then 1 when 'scheduled' then 2 else 3 end,
        c.last_modified_date desc
      limit 500
    `,
    db<AdminCaseSummary[]>`
      select
        count(*)::int as total,
        count(*) filter (where status = 'active')::int as active,
        count(*) filter (where status = 'scheduled')::int as scheduled,
        count(*) filter (where status = 'completed')::int as completed,
        count(*) filter (where status = 'on_hold')::int as "onHold",
        count(*) filter (where status = 'cancelled')::int as cancelled
      from case_management.cases
    `,
  ]);

  return {
    cases,
    summary: summary ?? { total: 0, active: 0, scheduled: 0, completed: 0, onHold: 0, cancelled: 0 },
  };
}
