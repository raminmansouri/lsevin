"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { stringFromForm } from "@core/lib/forms";
import { moderateReply, moderateReview, replyToReview } from "./repository";

export async function replyToReviewAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "view");
  await replyToReview({
    reviewId: stringFromForm(formData, "reviewId"),
    providerId,
    body: stringFromForm(formData, "body"),
    authorUserId: user.id,
  });
  revalidatePath(`/providers/${providerId}/reputation`);
  revalidatePath("/admin/reviews");
}

export async function moderateReviewAction(formData: FormData) {
  const user = await requireAdminUser("REVIEW_ADMIN");
  const decision = stringFromForm(formData, "decision", "approved") as "approved" | "rejected" | "hidden";
  await moderateReview({
    reviewId: stringFromForm(formData, "reviewId"),
    decision: ["approved", "rejected", "hidden"].includes(decision) ? decision : "approved",
    reviewerUserId: user.id,
    reason: stringFromForm(formData, "reason"),
  });
  revalidatePath("/admin/reviews");
}

export async function moderateReplyAction(formData: FormData) {
  const user = await requireAdminUser("REVIEW_ADMIN");
  const decision = stringFromForm(formData, "decision", "approved") as "approved" | "rejected" | "hidden";
  await moderateReply({
    replyId: stringFromForm(formData, "replyId"),
    decision: ["approved", "rejected", "hidden"].includes(decision) ? decision : "approved",
    reviewerUserId: user.id,
    reason: stringFromForm(formData, "reason"),
  });
  revalidatePath("/admin/reviews");
}
