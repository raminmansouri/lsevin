"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { booleanFromForm, stringFromForm } from "@core/lib/forms";
import { acceptProviderMemberInvitation, assignExistingProviderToUser, declineProviderMemberInvitation, removeProviderMember, resolveUserIdByEmail } from "./repository";

export async function assignExistingProviderAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageMembers");
  const directUserId = stringFromForm(formData, "userId");
  const email = stringFromForm(formData, "email");
  const resolvedUserId = directUserId || (await resolveUserIdByEmail(email));
  if (!resolvedUserId) throw new Error("User was not found. Enter a valid user ID or exact LSevin email.");
  await assignExistingProviderToUser({
    providerId,
    userId: resolvedUserId,
    role: stringFromForm(formData, "role", "manager"),
    isDefault: booleanFromForm(formData, "isDefault"),
  });
  revalidatePath(`/providers/${providerId}/settings`);
}

export async function removeProviderMemberAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageMembers");
  await removeProviderMember(providerId, stringFromForm(formData, "memberId"));
  revalidatePath(`/providers/${providerId}/settings`);
}

export async function acceptProviderInvitationAction(formData: FormData) {
  const user=await requireCurrentUser();
  const result=await acceptProviderMemberInvitation({invitationId:stringFromForm(formData,"invitationId"),token:stringFromForm(formData,"token"),userId:user.id,userEmail:user.email});
  revalidatePath("/providers"); revalidatePath(`/providers/${result.providerId}/dashboard`);
}
export async function declineProviderInvitationAction(formData: FormData) {
  const user=await requireCurrentUser();
  await declineProviderMemberInvitation({invitationId:stringFromForm(formData,"invitationId"),token:stringFromForm(formData,"token"),userId:user.id,userEmail:user.email});
  revalidatePath("/providers");
}
