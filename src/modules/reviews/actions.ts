"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission, requireStaffProfilePermission } from "@core/auth/permissions";
import { stringFromForm } from "@core/lib/forms";
import { sendTemplateNotification } from "@core/notifications/capability";
import { createProviderReviewReply, createStaffReviewReply, moderateReviewReply, moderateReviewReport } from "./repository";

export async function createReviewReplyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageProfile");
  const reviewId = stringFromForm(formData, "reviewId");
  await createProviderReviewReply({
    providerId,
    reviewId,
    userId: user.id,
    authorName: user.fullName || user.email,
    replyText: stringFromForm(formData, "replyText"),
  });
  await sendTemplateNotification({
    recipientEntityType: "provider", recipientEntityId: providerId, templateKey: "review.reply.pending",
    variables: { reviewId, providerId }, sourceModule: "reviews", sourceEntityType: "review", sourceEntityId: reviewId,
  });
  revalidatePath(`/providers/${providerId}/reviews`);
  revalidatePath(`/providers/${providerId}/notifications`);
}

export async function createStaffReviewReplyAction(formData: FormData) {
  const user = await requireCurrentUser();
  const staffId = stringFromForm(formData, "staffId");
  const claim = await requireStaffProfilePermission(user.id, staffId, "replyToOwnReviews");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const reviewId = stringFromForm(formData, "reviewId");
  await createStaffReviewReply({
    providerId: claim.serviceProviderId,
    staffId,
    reviewId,
    userId: user.id,
    authorName: user.fullName || user.email,
    replyText: stringFromForm(formData, "replyText"),
  });
  await sendTemplateNotification({
    recipientEntityType: "staff", recipientEntityId: staffId, templateKey: "review.reply.pending",
    variables: { reviewId, providerId: claim.serviceProviderId, staffId }, sourceModule: "reviews", sourceEntityType: "review", sourceEntityId: reviewId,
  });
  revalidatePath(`/staff/${staffId}/reviews`);
  revalidatePath(`/staff/${staffId}/notifications`);
}

export async function moderateReviewReplyAction(formData: FormData) {
  const user=await requireAdminUser("REVIEW_ADMIN"); const status=stringFromForm(formData,"status");
  if(status!=="approved"&&status!=="rejected") throw new Error("Invalid review reply moderation status.");
  const reply = await moderateReviewReply({replyId:stringFromForm(formData,"replyId"),status,reviewedByUserId:user.id});
  if (reply) {
    const recipientEntityType = reply.authorRole === "staff" && reply.staffId ? "staff" : "provider";
    const recipientEntityId = recipientEntityType === "staff" ? reply.staffId! : reply.providerId;
    await sendTemplateNotification({
      recipientEntityType, recipientEntityId, templateKey: status === "approved" ? "review.reply.approved" : "review.reply.rejected",
      variables: { reviewId: reply.reviewId, providerId: reply.providerId }, sourceModule: "reviews", sourceEntityType: "review", sourceEntityId: reply.reviewId,
    });
    if (recipientEntityType === "provider") revalidatePath(`/providers/${reply.providerId}/notifications`);
  }
  revalidatePath("/admin/reviews");
}
export async function moderateReviewReportAction(formData: FormData) {
  const user=await requireAdminUser("REVIEW_ADMIN"); const status=stringFromForm(formData,"status");
  if(status!=="actioned"&&status!=="dismissed") throw new Error("Invalid review report moderation status.");
  await moderateReviewReport({reportId:stringFromForm(formData,"reportId"),status,reviewedByUserId:user.id,note:stringFromForm(formData,"note")||undefined}); revalidatePath("/admin/reviews");
}
