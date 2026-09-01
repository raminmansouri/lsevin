"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { submitQuestion, submitReview } from "../api/review.repository";

const schema = z.object({
  productId: z.string().trim().regex(/^[0-9a-fA-F-]{36}$/),
  slug: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(4000).optional(),
});

export async function submitReviewAction(input: unknown) {
  const p = schema.parse(input);
  await submitReview({ productId: p.productId, rating: p.rating, title: p.title, body: p.body });
  revalidatePath(`/n/app/mobile/shop/product/${p.slug}`);
  return { ok: true as const };
}

const questionSchema = z.object({
  productId: z.string().trim().regex(/^[0-9a-fA-F-]{36}$/),
  slug: z.string().trim().min(1),
  question: z.string().trim().min(5).max(1000),
});
export async function submitQuestionAction(input: unknown) {
  const p = questionSchema.parse(input);
  await submitQuestion({ productId: p.productId, question: p.question });
  revalidatePath(`/n/app/mobile/shop/product/${p.slug}`);
  return { ok: true as const };
}
