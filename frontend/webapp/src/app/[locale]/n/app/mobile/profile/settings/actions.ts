"use server";

import { revalidatePath } from "next/cache";
import sql from "@/config/database/db";

import { requireIdentityUserId } from "./auth";
import type { UpdatePreferencesInput } from "./types";

function validateInput(input: UpdatePreferencesInput) {
  if (!["system", "light", "dark"].includes(input.preferredTheme)) {
    throw new Error("Invalid theme.");
  }
  if (!["km", "mi"].includes(input.distanceUnit)) {
    throw new Error("Invalid distance unit.");
  }
  if (!input.preferredLocale.trim()) {
    throw new Error("Preferred locale is required.");
  }
  if (!/^[A-Z]{3}$/.test(input.preferredCurrencyCode.trim().toUpperCase())) {
    throw new Error("Preferred currency must be a 3-letter code.");
  }
}

export async function updatePreferences(input: UpdatePreferencesInput) {
  validateInput(input);
  const userId = await requireIdentityUserId();

  await sql.begin(async (tx) => {
    await tx`
      insert into identity.user_preferences (
        user_id,
        preferred_locale,
        preferred_currency_code,
        preferred_theme,
        distance_unit,
        notifications_enabled,
        marketing_notifications_enabled,
        use_current_location,
        create_date,
        last_modified_date
      )
      values (
        ${userId},
        ${input.preferredLocale.trim()},
        ${input.preferredCurrencyCode.trim().toUpperCase()},
        ${input.preferredTheme},
        ${input.distanceUnit},
        ${input.notificationsEnabled},
        ${input.marketingNotificationsEnabled},
        ${input.useCurrentLocation},
        now(),
        now()
      )
      on conflict (user_id)
      do update set
        preferred_locale = excluded.preferred_locale,
        preferred_currency_code = excluded.preferred_currency_code,
        preferred_theme = excluded.preferred_theme,
        distance_unit = excluded.distance_unit,
        notifications_enabled = excluded.notifications_enabled,
        marketing_notifications_enabled = excluded.marketing_notifications_enabled,
        use_current_location = excluded.use_current_location,
        last_modified_date = now()
    `;
  });

  revalidatePath("/app/settings");
  revalidatePath("/settings");

  return { ok: true as const };
}
