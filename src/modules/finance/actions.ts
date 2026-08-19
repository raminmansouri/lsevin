"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { booleanFromForm, stringFromForm } from "@core/lib/forms";
import { addPayoutAccount, deletePayoutAccount, setDefaultPayoutAccount } from "./repository";

export async function addPayoutAccountAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageFinance");
  await addPayoutAccount({
    providerId,
    accountHolderName: stringFromForm(formData, "accountHolderName"),
    bankName: stringFromForm(formData, "bankName"),
    iban: stringFromForm(formData, "iban"),
    swiftCode: stringFromForm(formData, "swiftCode"),
    country: stringFromForm(formData, "country"),
    currencyCode: stringFromForm(formData, "currencyCode", "USD"),
    isDefault: booleanFromForm(formData, "isDefault"),
  });
  revalidatePath(`/providers/${providerId}/finance`);
}

export async function setDefaultPayoutAccountAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageFinance");
  await setDefaultPayoutAccount(providerId, stringFromForm(formData, "accountId"));
  revalidatePath(`/providers/${providerId}/finance`);
}

export async function deletePayoutAccountAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageFinance");
  await deletePayoutAccount(providerId, stringFromForm(formData, "accountId"));
  revalidatePath(`/providers/${providerId}/finance`);
}
