import { z } from "zod/v4";

import { CASE_PROVIDER_PERMISSIONS } from "./case-provider-types";
import { DATA_SCOPES } from "./sharing-schemas";

export const CreateCaseProviderGrantSchema = z.object({
  patientId: z.uuid(),
  medicalCaseId: z.uuid(),
  providerId: z.uuid(),
  bookingId: z.uuid().optional(),
  permission: z.enum(CASE_PROVIDER_PERMISSIONS),
  scope: z.array(z.enum(DATA_SCOPES)).min(1),
});
export type CreateCaseProviderGrantInput = z.input<typeof CreateCaseProviderGrantSchema>;

export const RevokeCaseProviderGrantSchema = z.object({
  patientId: z.uuid(),
  id: z.uuid(),
});
export type RevokeCaseProviderGrantInput = z.input<typeof RevokeCaseProviderGrantSchema>;

/** Provider-portal side: fulfilling an existing lab order, never freeform
 * (spec decision: "contribute" only ever attaches to a lab_order that's
 * already on the case). */
export const FulfillLabOrderSchema = z.object({
  providerId: z.uuid(),
  medicalCaseId: z.uuid(),
  labOrderId: z.uuid(),
  reportType: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().max(2000).optional(),
  observations: z
    .array(
      z.object({
        displayName: z.string().trim().min(1).max(200),
        valueNumber: z.number().optional(),
        valueText: z.string().trim().max(500).optional(),
        unit: z.string().trim().max(50).optional(),
        referenceLow: z.number().optional(),
        referenceHigh: z.number().optional(),
        interpretation: z.enum(["normal", "high", "low", "critical_high", "critical_low", "abnormal"]).optional(),
      })
    )
    .max(50)
    .optional(),
});
export type FulfillLabOrderInput = z.input<typeof FulfillLabOrderSchema>;
