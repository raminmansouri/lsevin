import "server-only";

import sql from "@/config/database/db";

export type BookingSettings = {
  shopProductsStepEnabled: boolean;
};

const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  shopProductsStepEnabled: false,
};

/**
 * Global booking-flow feature toggles (single row, `booking.settings`). Falls
 * back to safe defaults when the `0032` migration has not been applied yet, so
 * the wizard never breaks on a stale schema.
 */
export async function getBookingSettings(): Promise<BookingSettings> {
  try {
    const [row] = await sql<{ shop_products_step_enabled: boolean }[]>`
      select shop_products_step_enabled
      from booking.settings
      where id = 1
      limit 1
    `;
    if (!row) return DEFAULT_BOOKING_SETTINGS;
    return { shopProductsStepEnabled: Boolean(row.shop_products_step_enabled) };
  } catch {
    return DEFAULT_BOOKING_SETTINGS;
  }
}

export async function saveBookingSettings(
  input: BookingSettings,
): Promise<BookingSettings> {
  const [row] = await sql<{ shop_products_step_enabled: boolean }[]>`
    insert into booking.settings (id, shop_products_step_enabled, last_modified_date)
    values (1, ${input.shopProductsStepEnabled}, now())
    on conflict (id) do update set
      shop_products_step_enabled = excluded.shop_products_step_enabled,
      last_modified_date = now()
    returning shop_products_step_enabled
  `;
  return { shopProductsStepEnabled: Boolean(row?.shop_products_step_enabled) };
}
