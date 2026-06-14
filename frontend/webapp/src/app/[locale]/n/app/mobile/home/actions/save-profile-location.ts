'use server';

import { z } from 'zod';

import sql from '@/config/database/db';
import { getUserId } from '@/lib/auth/session';

const saveProfileLocationSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type SaveProfileLocationResult =
  | { success: true }
  | { success: false; reason: 'not_authenticated' | 'no_location' | 'error' };

/**
 * Persists the visitor's detected GPS location to their profile so it is
 * remembered across sessions and devices. The real device coordinates are
 * stored on `identity.user_preferences` together with the nearest resolved
 * supported destination. Guests (no session) are a no-op.
 */
export async function saveCurrentLocationToProfileAction(
  rawInput: z.input<typeof saveProfileLocationSchema>,
): Promise<SaveProfileLocationResult> {
  const input = saveProfileLocationSchema.parse(rawInput);

  const userId = await getUserId({ redirectToLogin: false }).catch(() => null);
  if (!userId) return { success: false, reason: 'not_authenticated' };

  // A resolved destination id is required so the saved location can be read
  // back through the preference lookup (which joins to category.locations).
  if (!input.countryId && !input.cityId) return { success: false, reason: 'no_location' };

  try {
    await sql`
      insert into identity.user_preferences (
        user_id,
        selected_country_location_id,
        selected_city_location_id,
        selected_picked_location_id,
        selected_source,
        use_current_location,
        current_latitude,
        current_longitude,
        last_modified_date
      )
      values (
        ${userId},
        ${input.countryId ?? null},
        ${input.cityId ?? null},
        null,
        'gps',
        true,
        ${input.latitude},
        ${input.longitude},
        now()
      )
      on conflict (user_id) do update set
        selected_country_location_id = excluded.selected_country_location_id,
        selected_city_location_id = excluded.selected_city_location_id,
        selected_picked_location_id = null,
        selected_source = 'gps',
        use_current_location = true,
        current_latitude = excluded.current_latitude,
        current_longitude = excluded.current_longitude,
        last_modified_date = now()
    `;

    return { success: true };
  } catch {
    return { success: false, reason: 'error' };
  }
}
