"use server";

import { revalidatePath } from "next/cache";

import sql from "@/config/database/db";
import { getAdminSession } from "@/lib/admin/auth";

import { forgetAssistantSettings } from "./limits";

const num = (formData: FormData, key: string) => {
  const value = Math.trunc(Number(formData.get(key) ?? 0));
  return Number.isFinite(value) ? Math.max(0, Math.min(100000, value)) : 0;
};

/** Saves the admin-set assistant limits (0 = no limit); they apply at once. */
export async function saveAssistantSettingsAction(formData: FormData) {
  await getAdminSession();
  await sql`
    update ai.settings set
      guest_daily_messages = ${num(formData, "guestDailyMessages")},
      user_daily_messages = ${num(formData, "userDailyMessages")},
      guest_messages_per_chat = ${num(formData, "guestMessagesPerChat")},
      user_messages_per_chat = ${num(formData, "userMessagesPerChat")},
      guest_max_chars = ${num(formData, "guestMaxChars")},
      user_max_chars = ${num(formData, "userMaxChars")},
      save_guest_chats = ${formData.get("saveGuestChats") === "on"},
      updated_at = now()
    where id = 1
  `;
  forgetAssistantSettings();
  revalidatePath("/[locale]/admin/assistant", "page");
}