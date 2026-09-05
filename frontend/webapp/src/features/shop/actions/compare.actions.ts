"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureGuestToken } from "../lib/context";
import { getCompareState, toggleCompare } from "../api/compare.repository";

const schema = z.object({ productId: z.string().trim().regex(/^[0-9a-fA-F-]{36}$/) });

/** Read-only compare state, for a statically-rendered PDP to resolve on mount. */
export async function getCompareStateAction(input: unknown) {
  const { productId } = schema.parse(input);
  try {
    return await getCompareState(productId);
  } catch {
    return { inList: false, count: 0 };
  }
}

export async function toggleCompareAction(input: unknown) {
  const { productId } = schema.parse(input);
  await ensureGuestToken();
  const res = await toggleCompare(productId);
  revalidatePath("/n/app/mobile/shop/compare");
  return { ok: true as const, ...res };
}
