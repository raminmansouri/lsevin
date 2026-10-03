"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/features/booking-admin-shared/server/db";
import { assertAdmin } from "@/lib/auth/admin-guard";

const translationsSchema = z.object({
  en: z.string().trim().min(1).max(300),
  fa: z.string().trim().min(1).max(300),
  ar: z.string().trim().min(1).max(300),
});

const stepSchema = z.object({
  stepKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/)
    .max(100),
  titleTranslations: translationsSchema,
  descriptionTranslations: z.object({
    en: z.string().trim().max(2000),
    fa: z.string().trim().max(2000),
    ar: z.string().trim().max(2000),
  }),
  timingAnchor: z.enum([
    "booking_created",
    "appointment_start",
    "appointment_end",
    "previous_step",
  ]),
  offsetMinutes: z.coerce.number().int().min(-525600).max(525600),
  estimatedDurationMinutes: z.coerce
    .number()
    .int()
    .min(0)
    .max(525600)
    .nullable(),
  responsibleRole: z.enum(["customer", "provider", "staff", "admin", "system"]),
  customerVisible: z.boolean(),
  providerVisible: z.boolean(),
  adminVisible: z.boolean(),
  requiresManualCompletion: z.boolean(),
});

const versionSchema = z.object({
  templateId: z.string().uuid(),
  expectedVersion: z.coerce.number().int().positive(),
  nameTranslations: translationsSchema,
  descriptionTranslations: z.object({
    en: z.string().trim().max(2000),
    fa: z.string().trim().max(2000),
    ar: z.string().trim().max(2000),
  }),
  steps: z.array(stepSchema).min(1).max(100),
});

export type TemplateVersionResult =
  | { ok: true; templateId: string }
  | { ok: false; error: "invalid" | "stale" | "unknown" };

export async function createProcessTemplateVersionAction(
  input: unknown
): Promise<TemplateVersionResult> {
  try {
    const actor = await assertAdmin();
    if (!actor.userId) return { ok: false, error: "unknown" };
    const values = versionSchema.parse(input);
    const stepKeys = new Set(values.steps.map((step) => step.stepKey));
    if (stepKeys.size !== values.steps.length)
      return { ok: false, error: "invalid" };

    const newTemplateId = await db.begin(async (tx) => {
      const [current] = await tx<
        Array<{
          version: number;
          scopeType: string;
          categoryId: string | null;
          serviceDefinitionId: string | null;
          providerServiceId: string | null;
          isActive: boolean;
        }>
      >`
        select version, scope_type as "scopeType", category_id::text as "categoryId",
          service_definition_id::text as "serviceDefinitionId",
          provider_service_id::text as "providerServiceId", is_active as "isActive"
        from case_management.process_templates
        where id = ${values.templateId}::uuid
        for update
      `;
      if (
        !current ||
        current.version !== values.expectedVersion ||
        !current.isActive
      )
        throw new Error("stale");

      await tx`
        update case_management.process_templates
        set is_active = false, last_modified_date = now()
        where id = ${values.templateId}::uuid
      `;
      const [created] = await tx<{ id: string }[]>`
        insert into case_management.process_templates(
          name_translations, description_translations, scope_type,
          category_id, service_definition_id, provider_service_id,
          is_active, version, created_by
        ) values (
          ${JSON.stringify(values.nameTranslations)}::jsonb,
          ${JSON.stringify(values.descriptionTranslations)}::jsonb,
          ${current.scopeType}, ${current.categoryId}::uuid,
          ${current.serviceDefinitionId}::uuid, ${current.providerServiceId}::uuid,
          true, ${current.version + 1}, ${actor.userId}::uuid
        ) returning id::text
      `;
      for (const [index, step] of values.steps.entries()) {
        await tx`
          insert into case_management.process_template_steps(
            template_id, step_key, display_order, title_translations,
            description_translations, timing_anchor, offset_minutes,
            estimated_duration_minutes, responsible_role, customer_visible,
            provider_visible, admin_visible, requires_manual_completion
          ) values (
            ${created.id}::uuid, ${step.stepKey}, ${index + 1},
            ${JSON.stringify(step.titleTranslations)}::jsonb,
            ${JSON.stringify(step.descriptionTranslations)}::jsonb,
            ${step.timingAnchor}, ${step.offsetMinutes},
            ${step.estimatedDurationMinutes}, ${step.responsibleRole},
            ${step.customerVisible}, ${step.providerVisible}, ${step.adminVisible},
            ${step.requiresManualCompletion}
          )
        `;
      }
      return created.id;
    });

    revalidatePath("/admin/case-templates");
    revalidatePath(`/admin/case-templates/${newTemplateId}`);
    return { ok: true, templateId: newTemplateId };
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, error: "invalid" };
    if (error instanceof Error && error.message === "stale")
      return { ok: false, error: "stale" };
    console.error("[CASE_TEMPLATE_VERSION]", error);
    return { ok: false, error: "unknown" };
  }
}
