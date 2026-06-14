import type { Sql } from "postgres";
import { CalendarCheck2, Coins, PiggyBank } from "lucide-react";
import { getTranslations } from "next-intl/server";

import sql from "@/config/database/db";

type CustomerStatsRow = {
  bookings_count: number;
  points_balance: number;
  saved_amount: string | number;
  currency_code: string;
};

type CustomerStats = {
  bookingsCount: number;
  pointsBalance: number;
  savedAmount: number;
  currencyCode: string;
};

type CustomerStatsProps = {
  identityUserId: string;
  locale?: string;
  className?: string;
};

export async function getCustomerStatsByIdentityUser(
  db: Sql,
  identityUserId: string
): Promise<CustomerStats> {
  const rows = await db<CustomerStatsRow[]>`
    WITH identity_user AS (
      SELECT
        id,
        email,
        phone_number,
        phone_number_country_code
      FROM identity.asp_net_users
      WHERE id = ${identityUserId}
      LIMIT 1
    ),

    resolved_customer AS (
      SELECT c.id
      FROM customer.customers c
      JOIN identity_user u
        ON lower(c.email) = lower(u.email)
        OR (
          c.phone_number = u.phone_number
          AND c.phone_number_country_code = u.phone_number_country_code
        )
      ORDER BY
        CASE
          WHEN lower(c.email) = lower((SELECT email FROM identity_user)) THEN 0
          ELSE 1
        END
      LIMIT 1
    ),

    booking_stats AS (
      SELECT COUNT(*)::int AS bookings_count
      FROM booking.bookings b
      JOIN identity_user u ON b.user_id = u.id
      WHERE COALESCE(b.booking_status, '') NOT IN ('Cancelled', 'Canceled')
    ),

    loyalty_stats AS (
      SELECT COALESCE(la.points_balance, 0)::int AS points_balance
      FROM resolved_customer rc
      LEFT JOIN loyalty.accounts la ON la.customer_id = rc.id
    ),

    saving_stats AS (
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN l.money_delta > 0 THEN l.money_delta
              ELSE 0
            END
          ),
          0
        )::numeric(18, 2) AS saved_amount
      FROM resolved_customer rc
      LEFT JOIN loyalty.ledger l ON l.customer_id = rc.id
    ),

    preference_stats AS (
      SELECT COALESCE(up.preferred_currency_code, 'USD') AS currency_code
      FROM identity_user u
      LEFT JOIN identity.user_preferences up ON up.user_id = u.id
    )

    SELECT
      COALESCE((SELECT bookings_count FROM booking_stats), 0)::int AS bookings_count,
      COALESCE((SELECT points_balance FROM loyalty_stats), 0)::int AS points_balance,
      COALESCE((SELECT saved_amount FROM saving_stats), 0)::numeric(18, 2) AS saved_amount,
      COALESCE((SELECT currency_code FROM preference_stats), 'USD') AS currency_code;
  `;

  const row = rows[0];

  return {
    bookingsCount: row?.bookings_count ?? 0,
    pointsBalance: row?.points_balance ?? 0,
    savedAmount: Number(row?.saved_amount ?? 0),
    currencyCode: row?.currency_code ?? "USD",
  };
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export async function CustomerStats({
  identityUserId,
  locale = "en",
  className = "",
}: CustomerStatsProps) {
  const stats = await getCustomerStatsByIdentityUser(sql, identityUserId);
  const t = await getTranslations({ locale, namespace: "MobileProfile.stats" });

  const items = [
    {
      label: t("bookings"),
      value: formatNumber(stats.bookingsCount, locale),
      icon: CalendarCheck2,
    },
    {
      label: t("points"),
      value: formatNumber(stats.pointsBalance, locale),
      icon: Coins,
    },
    {
      label: t("saved"),
      value: formatMoney(stats.savedAmount, stats.currencyCode, locale),
      icon: PiggyBank,
    },
  ];

  return (
    <div className={`grid grid-cols-3 gap-4 mt-6 ${className}`}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-100 bg-white/80 px-3 py-4 text-center shadow-sm"
          >
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
              <Icon size={18} className="text-gray-700" />
            </div>

            <div className="text-xl font-bold text-gray-900">
              {item.value}
            </div>

            <div className="mt-1 text-xs font-medium text-gray-500">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}