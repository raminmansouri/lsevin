// src/app/actions/user-preferences.ts
"use server";

import { revalidatePath } from "next/cache";
import { userPreferencesSchema, type UserPreferencesInput } from "@/lib/validations/user-preferences";
import { sql } from "@/lib/db";

async function getCurrentUserIdOrThrow(): Promise<string> {
  // Replace this with your auth/session lookup
  // Example: read from your cookie/session/JWT and return the authenticated user's id
  throw new Error("Implement getCurrentUserIdOrThrow()");
}

export async function saveUserPreferencesAction(input: UserPreferencesInput) {
  const userId = await getCurrentUserIdOrThrow();
  const data = userPreferencesSchema.parse(input);

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO identity.user_preferences (
        user_id,
        selected_country_location_id,
        selected_city_location_id,
        selected_picked_location_id,
        selected_source,
        use_current_location,
        current_latitude,
        current_longitude,
        preferred_locale,
        preferred_currency_code,
        preferred_theme,
        distance_unit,
        notifications_enabled,
        marketing_notifications_enabled,
        extra_preferences,
        last_modified_date
      )
      VALUES (
        ${userId},
        ${data.countryId ?? null},
        ${data.cityId ?? null},
        ${data.pickedLocationId ?? null},
        ${data.selectedSource},
        ${data.useCurrentLocation},
        ${data.currentLatitude ?? null},
        ${data.currentLongitude ?? null},
        ${data.preferredLocale},
        ${data.preferredCurrencyCode.toUpperCase()},
        ${data.preferredTheme},
        ${data.distanceUnit},
        ${data.notificationsEnabled},
        ${data.marketingNotificationsEnabled},
        ${JSON.stringify(data.extraPreferences ?? {})}::jsonb,
        now()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        selected_country_location_id = EXCLUDED.selected_country_location_id,
        selected_city_location_id = EXCLUDED.selected_city_location_id,
        selected_picked_location_id = EXCLUDED.selected_picked_location_id,
        selected_source = EXCLUDED.selected_source,
        use_current_location = EXCLUDED.use_current_location,
        current_latitude = EXCLUDED.current_latitude,
        current_longitude = EXCLUDED.current_longitude,
        preferred_locale = EXCLUDED.preferred_locale,
        preferred_currency_code = EXCLUDED.preferred_currency_code,
        preferred_theme = EXCLUDED.preferred_theme,
        distance_unit = EXCLUDED.distance_unit,
        notifications_enabled = EXCLUDED.notifications_enabled,
        marketing_notifications_enabled = EXCLUDED.marketing_notifications_enabled,
        extra_preferences = EXCLUDED.extra_preferences,
        last_modified_date = now()
    `;

    // Optional: keep your legacy user profile text fields synchronized
    const [countryRow] =
      data.countryId
        ? await tx`
            SELECT value_translations->>'en' AS name
            FROM category.locations
            WHERE id = ${data.countryId}
            LIMIT 1
          `
        : [];

    const [cityRow] =
      data.cityId
        ? await tx`
            SELECT value_translations->>'en' AS name
            FROM category.locations
            WHERE id = ${data.cityId}
            LIMIT 1
          `
        : [];

    await tx`
      UPDATE identity.asp_net_users
      SET
        country = ${countryRow?.name ?? null},
        city = ${cityRow?.name ?? null}
      WHERE id = ${userId}
    `;
  });

  revalidatePath("/app/profile");
  revalidatePath("/app/explore");

  return { success: true };
}