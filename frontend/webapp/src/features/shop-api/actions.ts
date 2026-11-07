"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateShopCatalog } from "@/features/shop/lib/cache";

import { SHOP_API_SCOPES } from "./scopes";
import { createApiToken, reviewChangeRequest, reviewNewProduct, revokeApiToken } from "./server/admin";

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const id = z.guid();

/** Known, admin-fixable failures carry their message; anything else is logged and generic. */
function failure(error: unknown, action: string): { ok: false; message: string } {
  const message = error instanceof Error ? error.message : "";
  if (/^Forbidden/.test(message)) return { ok: false, message: "You do not have permission for this." };
  const known = [
    "Give the token a name", "Pick at least one permission", "That seller does not exist", "Tokens cannot be issued",
    "Invalid expiry", "Write a short reason", "This product is no longer", "This change is no longer", "Unknown category",
  ];
  if (known.some((prefix) => message.startsWith(prefix))) return { ok: false, message };
  console.error(`[shop-api admin] ${action} failed`, error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sellerId: id,
  scopes: z.array(z.enum(SHOP_API_SCOPES)).min(1),
  expiresInDays: z.number().int().min(1).max(3650).nullable(),
});

/** Returns the token secret once; the page shows it and it is never retrievable again. */
export async function createApiTokenAction(input: unknown): Promise<Result<{ token: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Fill in the name, seller and at least one permission." };
  try {
    const { token } = await createApiToken(parsed.data);
    revalidatePath("/[locale]/admin/shop/api-tokens", "page");
    return { ok: true, token };
  } catch (error) {
    return failure(error, "create token");
  }
}

export async function revokeApiTokenAction(tokenId: string): Promise<Result> {
  const parsed = id.safeParse(tokenId);
  if (!parsed.success) return { ok: false, message: "Unknown token." };
  try {
    await revokeApiToken(parsed.data);
    revalidatePath("/[locale]/admin/shop/api-tokens", "page");
    return { ok: true };
  } catch (error) {
    return failure(error, "revoke token");
  }
}

const reviewSchema = z.object({
  targetId: id,
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(1000).nullable().optional(),
});

export async function reviewApiProductAction(input: unknown): Promise<Result> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  try {
    await reviewNewProduct({ productId: parsed.data.targetId, decision: parsed.data.decision, note: parsed.data.note });
    revalidateShopCatalog();
    revalidatePath("/[locale]/admin/shop/api-review", "page");
    return { ok: true };
  } catch (error) {
    return failure(error, "review product");
  }
}

export async function reviewApiChangeAction(input: unknown): Promise<Result> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  try {
    await reviewChangeRequest({ requestId: parsed.data.targetId, decision: parsed.data.decision, note: parsed.data.note });
    revalidateShopCatalog();
    revalidatePath("/[locale]/admin/shop/api-review", "page");
    return { ok: true };
  } catch (error) {
    return failure(error, "review change");
  }
}
