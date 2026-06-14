// src/app/actions/get-user-preferences.ts
"use server";

import { sql } from "@/lib/db";

async function getCurrentUserIdOrThrow(): Promise<string> {
  throw new Error("Implement getCurrentUserIdOrThrow()");
}

export async function getUserPreferencesAction() {
  const userId = await getCurrentUserIdOrThrow();

  const [row] = await sql`
    SELECT
      up.user_id,
      up.selected_country_location_id,
      up.selected_city_location_id,
      up.selected_picked_location_id,
      up.selected_source,
      up.use_current_location,
      up.current_latitude,
      up.current_longitude,
      up.preferred_locale,
      up.preferred_currency_code,
      up.preferred_theme,
      up.distance_unit,
      up.notifications_enabled,
      up.marketing_notifications_enabled,
      up.extra_preferences,
      country.value_translations->>'en' AS selected_country_name,
      city.value_translations->>'en' AS selected_city_name,
      picked.image AS picked_location_image
    FROM identity.user_preferences up
    LEFT JOIN category.locations country
      ON country.id = up.selected_country_location_id
    LEFT JOIN category.locations city
      ON city.id = up.selected_city_location_id
    LEFT JOIN category.picked_locations picked
      ON picked.id = up.selected_picked_location_id
    WHERE up.user_id = ${userId}
    LIMIT 1
  `;

  return row ?? null;
}