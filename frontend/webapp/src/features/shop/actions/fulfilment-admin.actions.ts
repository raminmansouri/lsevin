"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import sql from "@/config/database/db";

import { assertShopPermission, SHOP_PERMISSIONS } from "../lib/permissions";
import { shopId } from "../schemas/id";
import {
  advanceSellerPart,
  approveSellerPart,
  confirmSellerPickupCode,
  rejectSellerPart,
  SellerFulfilmentError,
} from "../server/seller-fulfilment.service";

/**
 * Admin fulfilment. An admin moves the DEFAULT seller's (Lsevin's) part of an order, like a clinic
 * does for its own part in the portal, and approves or rejects every seller's "delivered" request.
 * Results come back as values so the page can show the reason instead of an error page.
 */

// Flat: no strictNullChecks in this repo, so a boolean-discriminated union would not narrow.
type ActionResult = { ok: boolean; error?: string; reason?: string; attemptsLeft?: number };

function rv(orderId?: string) {
  revalidatePath("/admin/shop/orders");
  revalidatePath("/admin/shop/approvals");
  if (orderId) revalidatePath(`/admin/shop/orders/${orderId}`);
}

function failure(error: unknown): ActionResult {
  if (error instanceof SellerFulfilmentError) return { ok: false, error: error.message, reason: error.reason };
  // Unexpected (database, network): logged, never shown as a user mistake.
  console.error("[shop] admin fulfilment action failed", { error: (error as Error)?.message });
  return { ok: false, error: "Something went wrong. Try again.", reason: "unexpected" };
}

/** The admin may move only the default seller's part; clinics move theirs in the portal. */
async function assertDefaultSeller(sellerId: string) {
  const [row] = await sql<{ ok: boolean }[]>`select is_default as ok from shop.sellers where id = ${sellerId}::uuid`;
  if (!row?.ok) throw new SellerFulfilmentError("not_found", "Only the seller can move its own part; approve it when it asks.");
}

const advanceSchema = z.object({
  orderId: shopId,
  sellerId: shopId,
  to: z.enum(["preparing", "shipped", "ready_for_pickup", "delivery_requested"]),
  trackingCode: z.string().trim().max(64).optional().nullable(),
  carrier: z.string().trim().max(80).optional().nullable(),
});

export async function advanceDefaultSellerPartAction(input: unknown): Promise<ActionResult> {
  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request.", reason: "invalid" };
  try {
    const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
    await assertDefaultSeller(parsed.data.sellerId);
    await advanceSellerPart({ ...parsed.data, actorUserId: userId ?? null });
    rv(parsed.data.orderId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function confirmDefaultSellerPickupAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ orderId: shopId, sellerId: shopId, code: z.string().max(32) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request.", reason: "invalid" };
  try {
    const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
    await assertDefaultSeller(parsed.data.sellerId);
    const result = await confirmSellerPickupCode({ ...parsed.data, actorUserId: userId ?? null });
    rv(parsed.data.orderId);
    if (result.ok) return { ok: true };
    return { ok: false, error: result.reason ?? "wrong_code", reason: result.reason, attemptsLeft: result.attemptsLeft };
  } catch (error) {
    return failure(error);
  }
}

const partSchema = z.object({ orderId: shopId, sellerId: shopId });

/** Form action: the seller's part reached the customer. */
export async function approveSellerPartForm(formData: FormData) {
  const input = partSchema.parse({ orderId: formData.get("orderId"), sellerId: formData.get("sellerId") });
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  await approveSellerPart({ ...input, adminUserId: userId ?? null });
  rv(input.orderId);
}

/** Form action: not delivered after all; back to the previous state with the reason. */
export async function rejectSellerPartForm(formData: FormData) {
  const input = partSchema
    .extend({ reason: z.string().trim().min(2).max(500) })
    .parse({ orderId: formData.get("orderId"), sellerId: formData.get("sellerId"), reason: formData.get("reason") });
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  await rejectSellerPart({ ...input, adminUserId: userId ?? null });
  rv(input.orderId);
}

/** Form action (delivery page): the cap on what a seller may charge for shipping, in rial; empty = none. */
export async function saveSellerFeeCapForm(formData: FormData) {
  const raw = String(formData.get("cap") ?? "").replace(/[,\s]/g, "");
  const cap = raw === "" ? null : z.coerce.number().int().min(0).max(1_000_000_000_000).parse(raw);
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  await sql`
    insert into shop.shipping_settings (id, seller_fee_cap, updated_by_user_id, updated_at)
    values (true, ${cap}, ${userId ?? null}::uuid, now())
    on conflict (id) do update set seller_fee_cap = excluded.seller_fee_cap,
      updated_by_user_id = excluded.updated_by_user_id, updated_at = now()
  `;
  revalidatePath("/admin/shop/delivery");
}
