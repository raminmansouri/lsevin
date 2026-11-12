"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { shopId } from "../schemas/id";
import { confirmOfficePickup, markOrderReadyForOfficePickup } from "../server/office-pickup.service";
import { markSellerPartReceived } from "../server/seller-handover.service";

/**
 * Admin fulfilment: receiving partner sellers' items, and handing an order over at the Lsevin
 * office with the customer's pickup code. Results come back as values so the page can show a
 * wrong code (and the tries left) instead of an error page.
 */

// Flat: no strictNullChecks in this repo, so a boolean-discriminated union would not narrow.
type ActionResult = { ok: boolean; error?: string; reason?: "wrong_code" | "code_locked"; attemptsLeft?: number };

function rv(orderId: string) {
  revalidatePath("/admin/shop/orders");
  revalidatePath(`/admin/shop/orders/${orderId}`);
  revalidatePath("/admin/shop/inbound");
}

const message = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong.");

export async function markOfficeReadyAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ orderId: shopId }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order." };
  try {
    await markOrderReadyForOfficePickup(parsed.data.orderId);
    rv(parsed.data.orderId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function confirmOfficePickupAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ orderId: shopId, code: z.string().max(32) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const result = await confirmOfficePickup(parsed.data.orderId, parsed.data.code);
    rv(parsed.data.orderId);
    if (result.ok) return { ok: true };
    return { ok: false, error: result.reason ?? "wrong_code", reason: result.reason, attemptsLeft: result.attemptsLeft };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

const receivedSchema = z.object({ orderId: shopId, sellerId: shopId });

/** Form action ("received" button on the inbound list and the order page). */
export async function markSellerReceivedForm(formData: FormData) {
  const input = receivedSchema.parse({ orderId: formData.get("orderId"), sellerId: formData.get("sellerId") });
  await markSellerPartReceived(input);
  rv(input.orderId);
}
