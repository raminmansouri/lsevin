import sql from "@/config/database/db";

import { requireIdentityUserId } from "./auth";
import type { SettingsOverview } from "./types";

export async function getSettingsOverview(): Promise<SettingsOverview> {
  const userId = await requireIdentityUserId();

  const userRows = await sql<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number_country_code: string;
    phone_number: string;
    is_profile_confirmed: boolean;
  }[]>`
    select
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number_country_code,
      u.phone_number,
      u.is_profile_confirmed
    from identity.asp_net_users u
    where u.id = ${userId}
    limit 1
  `;

  const user = userRows[0];
  if (!user) throw new Error("Authenticated user was not found.");

  const preferenceRows = await sql<{
    preferred_locale: string;
    preferred_currency_code: string;
    preferred_theme: "system" | "light" | "dark";
    distance_unit: "km" | "mi";
    notifications_enabled: boolean;
    marketing_notifications_enabled: boolean;
    use_current_location: boolean;
    selected_country_name: string | null;
    selected_city_name: string | null;
  }[]>`
    select
      coalesce(p.preferred_locale, 'en') as preferred_locale,
      coalesce(p.preferred_currency_code, 'USD') as preferred_currency_code,
      coalesce(p.preferred_theme, 'system') as preferred_theme,
      coalesce(p.distance_unit, 'km') as distance_unit,
      coalesce(p.notifications_enabled, true) as notifications_enabled,
      coalesce(p.marketing_notifications_enabled, false) as marketing_notifications_enabled,
      coalesce(p.use_current_location, false) as use_current_location,
      country_loc.value_translations ->> 'en' as selected_country_name,
      city_loc.value_translations ->> 'en' as selected_city_name
    from identity.asp_net_users u
    left join identity.user_preferences p on p.user_id = u.id
    left join category.locations country_loc on country_loc.id = p.selected_country_location_id
    left join category.locations city_loc on city_loc.id = p.selected_city_location_id
    where u.id = ${userId}
    limit 1
  `;

  const preference = preferenceRows[0];

  const summaryRows = await sql<{
    unread_notifications: number;
    favorites_count: number;
    has_wallet: boolean;
    available_wallet_amount: string | null;
    referral_code: string | null;
  }[]>`
    with customer_row as (
      select c.id
      from customer.customers c
      where c.id = ${userId}
      limit 1
    ),
    wallet_row as (
      select wb.available_amount::text as available_amount
      from customer.wallet_balances wb
      join identity.user_preferences p on p.user_id = wb.user_id
      where wb.user_id = ${userId}
        and wb.currency_code = p.preferred_currency_code
      order by wb.wallet_account_id
      limit 1
    ),
    wallet_fallback as (
      select wb.available_amount::text as available_amount
      from customer.wallet_balances wb
      where wb.user_id = ${userId}
      order by wb.wallet_account_id, wb.currency_code
      limit 1
    )
    select
      (
        select count(*)::int
        from notify.notifications n
        join customer_row c on c.id = n.customer_id
        where n.read_at is null
      ) as unread_notifications,
      (
        select count(*)::int
        from customer.favorites f
        join customer_row c on c.id = f.customer_id
      ) as favorites_count,
      exists(select 1 from customer.wallet_accounts wa where wa.user_id = ${userId}) as has_wallet,
      coalesce((select available_amount from wallet_row), (select available_amount from wallet_fallback)) as available_wallet_amount,
      (
        select a.referral_code
        from loyalty.accounts a
        join customer_row c on c.id = a.customer_id
        limit 1
      ) as referral_code
  `;

  const summary = summaryRows[0] ?? {
    unread_notifications: 0,
    favorites_count: 0,
    has_wallet: false,
    available_wallet_amount: null,
    referral_code: null,
  };

  return {
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumberCountryCode: user.phone_number_country_code,
      phoneNumber: user.phone_number,
      profileConfirmed: user.is_profile_confirmed,
    },
    preferences: {
      preferredLocale: preference?.preferred_locale ?? "fa",
      preferredCurrencyCode: preference?.preferred_currency_code ?? "USD",
      preferredTheme: preference?.preferred_theme ?? "system",
      distanceUnit: preference?.distance_unit ?? "km",
      notificationsEnabled: preference?.notifications_enabled ?? true,
      marketingNotificationsEnabled: preference?.marketing_notifications_enabled ?? false,
      useCurrentLocation: preference?.use_current_location ?? false,
      selectedCountryName: preference?.selected_country_name ?? null,
      selectedCityName: preference?.selected_city_name ?? null,
    },
    summary: {
      unreadNotifications: summary.unread_notifications ?? 0,
      favoritesCount: summary.favorites_count ?? 0,
      hasWallet: summary.has_wallet ?? false,
      availableWalletAmount: summary.available_wallet_amount ?? null,
      referralCode: summary.referral_code ?? null,
    },
  };
}
