"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { answerQuestion, moderateReview, setQuestionHidden } from "../server/admin-content.service";

const id = z.string().trim().regex(/^[0-9a-fA-F-]{36}$/);

export async function moderateReviewForm(formData: FormData) {
  const p = z.object({ id, decision: z.enum(["approved", "rejected"]) }).parse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  await moderateReview(p);
  revalidatePath("/admin/shop/reviews");
}

export async function answerQuestionForm(formData: FormData) {
  const p = z.object({ id, answer: z.string().trim().min(1).max(4000) }).parse({
    id: formData.get("id"),
    answer: formData.get("answer"),
  });
  await answerQuestion(p);
  revalidatePath("/admin/shop/reviews");
}

export async function setQuestionHiddenForm(formData: FormData) {
  const p = z.object({ id, hidden: z.coerce.boolean() }).parse({
    id: formData.get("id"),
    hidden: formData.get("hidden"),
  });
  await setQuestionHidden(p);
  revalidatePath("/admin/shop/reviews");
}
