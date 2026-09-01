import "server-only";

import { getShopContext } from "../lib/context";
import { sql } from "../lib/db";

/**
 * Product reviews (SHP-V02-018). Only a verified buyer — a customer with a paid
 * order line for the product — may submit, and every review lands `pending` for
 * moderation (SHP-V02-017). One review per (customer, product).
 */

const PURCHASED_STATUSES = ["paid", "processing", "partially_shipped", "shipped", "completed", "partially_refunded"];

export async function getReviewEligibility(productId: string): Promise<{
  canReview: boolean;
  canAsk: boolean;
  alreadyReviewed: boolean;
  orderItemId: string | null;
}> {
  const ctx = await getShopContext();
  if (!ctx.customerId) return { canReview: false, canAsk: false, alreadyReviewed: false, orderItemId: null };

  const [purchase] = await sql<{ order_item_id: string }[]>`
    select oi.id::text as order_item_id
    from shop.order_items oi
    join shop.orders o on o.id = oi.order_id
    where oi.product_id = ${productId}::uuid
      and o.customer_id = ${ctx.customerId}::uuid
      and o.status::text = any(${PURCHASED_STATUSES})
    order by o.placed_at desc
    limit 1
  `;
  const [existing] = await sql<{ id: string }[]>`
    select id::text as id from shop.product_reviews
    where product_id = ${productId}::uuid and customer_id = ${ctx.customerId}::uuid
    limit 1
  `;
  return {
    canReview: Boolean(purchase) && !existing,
    canAsk: true, // any signed-in customer may ask a question (SHP-V02-017)
    alreadyReviewed: Boolean(existing),
    orderItemId: purchase?.order_item_id ?? null,
  };
}

export async function submitReview(input: {
  productId: string;
  rating: number;
  title?: string | null;
  body?: string | null;
}): Promise<void> {
  const ctx = await getShopContext();
  if (!ctx.customerId) throw new Error("Sign in to review.");
  const rating = Math.max(1, Math.min(5, Math.trunc(input.rating)));

  const elig = await getReviewEligibility(input.productId);
  if (elig.alreadyReviewed) throw new Error("You have already reviewed this product.");
  if (!elig.canReview) throw new Error("Only verified buyers can review this product.");

  await sql`
    insert into shop.product_reviews (product_id, order_item_id, customer_id, rating, title, body, status, is_verified_purchase)
    values (${input.productId}::uuid, ${elig.orderItemId}::uuid, ${ctx.customerId}::uuid, ${rating},
      ${input.title?.trim() || null}, ${input.body?.trim() || null}, 'pending', true)
  `;
}

/** Any signed-in customer may ask a question (SHP-V02-017). Lands `open`. */
export async function submitQuestion(input: { productId: string; question: string }): Promise<void> {
  const ctx = await getShopContext();
  if (!ctx.customerId) throw new Error("Sign in to ask a question.");
  const q = input.question.trim();
  if (q.length < 5) throw new Error("Please write a longer question.");
  await sql`
    insert into shop.product_questions (product_id, customer_id, question, status)
    values (${input.productId}::uuid, ${ctx.customerId}::uuid, ${q}, 'open')
  `;
}
