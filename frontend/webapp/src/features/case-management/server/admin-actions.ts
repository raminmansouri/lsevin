"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/features/booking-admin-shared/server/db";
import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  canTransitionCaseStep,
  CASE_STEP_STATUSES,
} from "../lib/case-step-transitions";

const updateSchema = z.object({
  caseId: z.string().uuid(),
  caseStepId: z.string().uuid(),
  lockVersion: z.coerce.number().int().positive(),
  status: z.enum(CASE_STEP_STATUSES),
  note: z.string().trim().max(2000).optional().nullable(),
});

export type AdminCaseStepActionResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "stale" | "invalid_transition" | "unknown";
    };

export async function updateAdminCaseStepAction(
  input: unknown
): Promise<AdminCaseStepActionResult> {
  try {
    const actor = await assertAdmin();
    const values = updateSchema.parse(input);

    await db.begin(async (tx) => {
      const [step] = await tx<{ status: string; lockVersion: number }[]>`
        select status, lock_version as "lockVersion"
        from case_management.case_steps
        where id = ${values.caseStepId}::uuid and case_id = ${values.caseId}::uuid
        for update
      `;
      if (!step) throw new Error("not_found");
      if (step.lockVersion !== values.lockVersion) throw new Error("stale");
      if (!canTransitionCaseStep(step.status, values.status))
        throw new Error("invalid_transition");

      await tx`
        update case_management.case_steps
        set status = ${values.status},
            started_at = case when ${values.status} = 'in_progress' then coalesce(started_at, now()) else started_at end,
            completed_at = case when ${values.status} = 'completed' then now() else null end,
            completed_by = case when ${values.status} = 'completed' then ${actor.userId ?? null}::uuid else null end,
            completion_note = nullif(${values.note ?? ""}, ''),
            lock_version = lock_version + 1,
            last_modified_date = now()
        where id = ${values.caseStepId}::uuid
      `;
      await tx`
        insert into case_management.case_events(
          case_id, case_step_id, event_type, actor_user_id, actor_role,
          from_status, to_status, note
        ) values (
          ${values.caseId}::uuid, ${values.caseStepId}::uuid, 'step.status_changed',
          ${actor.userId ?? null}::uuid, 'admin', ${step.status}, ${values.status}, nullif(${values.note ?? ""}, '')
        )
      `;

      const [progress] = await tx<
        {
          nextStepId: string | null;
          incomplete: number;
          active: number;
          blocked: number;
        }[]
      >`
        select
          (array_agg(id::text order by display_order) filter (
            where status not in ('completed', 'skipped', 'cancelled')
          ))[1] as "nextStepId",
          count(*) filter (where status not in ('completed', 'skipped', 'cancelled'))::int as incomplete,
          count(*) filter (where status = 'in_progress')::int as active,
          count(*) filter (where status = 'blocked')::int as blocked
        from case_management.case_steps where case_id = ${values.caseId}::uuid
      `;
      const caseStatus =
        progress.incomplete === 0
          ? "completed"
          : progress.blocked > 0
            ? "on_hold"
            : progress.active > 0
              ? "active"
              : "scheduled";
      await tx`
        update case_management.cases
        set current_step_id = ${progress.nextStepId}::uuid,
            status = ${caseStatus},
            started_at = case when ${caseStatus} = 'active' then coalesce(started_at, now()) else started_at end,
            completed_at = case when ${caseStatus} = 'completed' then now() else null end,
            lock_version = lock_version + 1,
            last_modified_date = now()
        where id = ${values.caseId}::uuid
      `;
    });

    revalidatePath(`/admin/cases/${values.caseId}`);
    revalidatePath("/admin/cases");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message === "not_found" ||
      message === "stale" ||
      message === "invalid_transition"
    ) {
      return { ok: false, error: message };
    }
    return { ok: false, error: "unknown" };
  }
}
