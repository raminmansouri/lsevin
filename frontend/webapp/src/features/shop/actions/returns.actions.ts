"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  receiveReturn,
  requestOrderCancellation,
  reviewReturnRequest,
  submitReturnRequest,
} from "../server/returns.service";

const id = z.string().trim().regex(/^[0-9a-fA-F-]{36}$/);

// ---- customer ----------------------------------------------------------------

const cancelSchema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
  email: z.string().email().optional().nullable(),
  reason: z.string().trim().max(500).optional(),
});
export async function cancelOrderAction(input: unknown) {
  const p = cancelSchema.parse(input);
  const res = await requestOrderCancellation(p);
  revalidatePath(`/n/app/mobile/shop/order/${p.orderNumber}`);
  revalidatePath("/n/app/mobile/shop/orders");
  return { ok: true as const, ...res };
}

const returnSchema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
  email: z.string().email().optional().nullable(),
  reason: z.string().trim().min(2).max(500),
  items: z
    .array(z.object({ orderItemId: id, quantity: z.coerce.number().int().min(0).max(999), reason: z.string().trim().max(200).optional() }))
    .min(1),
});
export async function submitReturnAction(input: unknown) {
  const p = returnSchema.parse(input);
  const res = await submitReturnRequest(p);
  revalidatePath(`/n/app/mobile/shop/order/${p.orderNumber}`);
  return { ok: true as const, ...res };
}

// ---- admin -----------------------------------------------------------------

export async function reviewReturnForm(formData: FormData) {
  const p = z.object({ id, decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(500).optional() }).parse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    note: formData.get("note") || undefined,
  });
  await reviewReturnRequest(p);
  revalidatePath("/admin/shop/returns");
}

export async function receiveReturnForm(formData: FormData) {
  const p = z.object({ id, restock: z.coerce.boolean() }).parse({
    id: formData.get("id"),
    restock: formData.get("restock") === "on",
  });
  await receiveReturn(p);
  revalidatePath("/admin/shop/returns");
}
