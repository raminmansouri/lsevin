import "server-only";

import sql from "@/config/database/db";

import { computeEarnedPoints, getPointsEarnDivisor } from "./loyalty-settings.repository";

export type BookingSpendSummary = {
  totalSpent: number;
  bookingsCount: number;
  lastBookingDate: string | null;
  points: number;
};

/**
 * The single source of a customer's loyalty points. Both the profile tile and the
 * Rewards page read it, so they always show the same number. Points are derived from
 * booking spend at read time (see loyalty-settings.repository.ts for the formula);
 * loyalty.accounts.points_balance is not used here, because nothing writes it when a
 * customer books, so it stays 0 for almost everyone.
 *
 * `identityUserId` is identity.asp_net_users.id (what the session stores), which is
 * what booking.bookings.user_id holds.
 */
export async function getBookingSpendSummary(identityUserId: string | null | undefined): Promise<BookingSpendSummary> {
  if (!identityUserId) return { totalSpent: 0, bookingsCount: 0, lastBookingDate: null, points: 0 };

  const [row] = await sql<{ total_spent: number | null; bookings_count: number | null; last_booking_date: string | null }[]>`
    select
      coalesce(sum(ps.value), 0)::float as total_spent,
      count(*)::int as bookings_count,
      max(b.create_date)::text as last_booking_date
    from booking.bookings b
    join category.provider_services ps on ps.id = b.service_id
    where b.user_id = ${identityUserId}::uuid
      and coalesce(b.booking_status, '') <> 'Cancelled'
  `;

  const totalSpent = Number(row?.total_spent ?? 0);
  const divisor = await getPointsEarnDivisor();
  return {
    totalSpent,
    bookingsCount: Number(row?.bookings_count ?? 0),
    lastBookingDate: row?.last_booking_date ?? null,
    points: computeEarnedPoints(totalSpent, divisor),
  };
}
