import "server-only";

import sql from "@/config/database/db";

import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";

/**
 * Moderation of customer-generated content (SHP-V02-017/018). Reviews are
 * approve/reject; questions are answer/hide. Gated on `shop.catalog.manage`.
 */

export async function moderateReview(input: { id: string; decision: "approved" | "rejected" }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`
    update shop.product_reviews
    set status = ${input.decision}::shop.review_status, last_modified_date = now()
    where id = ${input.id}::uuid
  `;
}

export async function answerQuestion(input: { id: string; answer: string }): Promise<void> {
  const { userId } = await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  if (!input.answer?.trim()) throw new Error("An answer is required.");
  await sql`
    update shop.product_questions
    set answer = ${input.answer.trim()}, answered_by = ${userId ?? null}::uuid,
        status = 'answered'::shop.question_status, last_modified_date = now()
    where id = ${input.id}::uuid
  `;
}

export async function setQuestionHidden(input: { id: string; hidden: boolean }): Promise<void> {
  await assertShopPermission(SHOP_PERMISSIONS.catalogManage);
  await sql`
    update shop.product_questions
    set status = ${input.hidden ? "hidden" : "open"}::shop.question_status, last_modified_date = now()
    where id = ${input.id}::uuid
  `;
}
