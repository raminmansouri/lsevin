"use server";

import { z } from "zod";

import { emitCommerceEvent } from "../lib/analytics";

const schema = z.object({
  serviceDefinitionId: z.string().trim().regex(/^[0-9a-fA-F-]{36}$/),
  productId: z.string().trim().regex(/^[0-9a-fA-F-]{36}$/),
  surface: z.string().trim().max(40).optional(),
});

/** Records a click on a service-related product rail (SHP-V02-019). */
export async function logServiceRelationClickAction(input: unknown) {
  const p = schema.parse(input);
  await emitCommerceEvent("shop_related_service_product_click", {
    productId: p.productId,
    campaignKey: p.serviceDefinitionId,
    surface: p.surface ?? "product_service_rail",
  });
  return { ok: true as const };
}
