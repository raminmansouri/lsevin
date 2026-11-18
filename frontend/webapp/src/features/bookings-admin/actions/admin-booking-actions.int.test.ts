/**
 * Admin booking create/update/add-on actions against the real local Postgres.
 *
 * The actions use the shared pool (not a test transaction), so every row they create is
 * tracked and deleted in afterAll. Child bookings cascade with their parent.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const adminState = vi.hoisted(() => ({ ctx: { userId: "00000000-0000-4000-8000-0000000000aa", roles: ["admin"], isAdmin: true, isSuperAdmin: false } }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/features/notification/server/booking-notifications", () => ({ notifyBookingStatusChanged: vi.fn(async () => undefined) }));
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: vi.fn(async () => adminState.ctx),
  assertAdmin: vi.fn(async () => {
    if (!adminState.ctx.isAdmin) throw new Error("Forbidden");
    return adminState.ctx;
  }),
}));

import { db } from "@/features/booking-admin-shared/server/db";

import { addHotelStayAddonAction, addTransferAddonAction, removeChildBookingAction } from "./booking-addons";
import { saveBookingAction } from "./save-booking";

type Fixture = { providerId: string; serviceId: string; otherServiceId: string; userId: string; hotelId: string; transferProviderId: string; transferServiceId: string };
let fx: Fixture;
const createdBookings: string[] = [];
let routeId: string | null = null;

beforeAll(async () => {
  const [svc] = await db<{ providerId: string; serviceId: string }[]>`
    select service_provider_id::text as "providerId", id::text as "serviceId" from category.provider_services limit 1`;
  const [other] = await db<{ id: string }[]>`
    select id::text as id from category.provider_services where service_provider_id <> ${svc.providerId} limit 1`;
  const [user] = await db<{ id: string }[]>`select id::text as id from identity.asp_net_users limit 1`;
  const [hotel] = await db<{ id: string }[]>`
    select sp.id::text as id from category.service_providers sp
    join category.provider_types pt on pt.id = sp.provider_type_id
    where lower(pt.name_translations->>'en-US') = 'accommodations' limit 1`;
  const [transfer] = await db<{ providerId: string; serviceId: string }[]>`
    select ps.service_provider_id::text as "providerId", ps.id::text as "serviceId"
    from category.provider_services ps
    join category.service_providers sp on sp.id = ps.service_provider_id
    where sp.provider_type_id is not null
      and not exists (select 1 from transfer.routes r where r.provider_service_id = ps.id)
    limit 1`;
  fx = {
    providerId: svc.providerId,
    serviceId: svc.serviceId,
    otherServiceId: other.id,
    userId: user.id,
    hotelId: hotel.id,
    transferProviderId: transfer.providerId,
    transferServiceId: transfer.serviceId,
  };
  const [route] = await db<{ id: string }[]>`
    insert into transfer.routes (service_provider_id, provider_service_id, from_translations, to_translations, vehicle_type)
    values (${fx.transferProviderId}, ${fx.transferServiceId}, '{"en-US":"TEST airport"}'::jsonb, '{"en-US":"TEST hotel"}'::jsonb, 'van')
    returning id::text as id`;
  routeId = route.id;
});

afterAll(async () => {
  if (createdBookings.length) await db`delete from booking.bookings where id = any(${createdBookings}::uuid[])`;
  if (routeId) await db`delete from transfer.routes where id = ${routeId}`;
  await db.end({ timeout: 5 });
});

beforeEach(() => {
  adminState.ctx = { userId: "00000000-0000-4000-8000-0000000000aa", roles: ["admin"], isAdmin: true, isSuperAdmin: false };
});

function bookingInput(overrides: Record<string, unknown> = {}) {
  return {
    providerId: fx.providerId,
    serviceId: fx.serviceId,
    userId: fx.userId,
    selectedDate: "2030-01-15",
    selectedTimeFrom: "03:00",
    selectedTimeTo: "04:00",
    paymentMethod: "bank",
    bookingStatus: "Confirmed",
    paymentStatus: "Paid",
    currencyCode: "IRT",
    totalAmount: "123456.78",
    paidAmount: "1000",
    adults: 2,
    adminNotes: "created in test",
    ...overrides,
  };
}

describe("saveBookingAction", () => {
  it("creates a booking with an arbitrary price, marks it admin-created, then updates it", async () => {
    const created = await saveBookingAction(bookingInput());
    expect(created.ok).toBe(true);
    const bookingId = created.data!.bookingId;
    createdBookings.push(bookingId);

    const [row] = await db<any[]>`select booking_status, payment_status, total_amount::text as total, currency_code, metadata from booking.bookings where id = ${bookingId}`;
    expect(row.booking_status).toBe("Confirmed");
    expect(row.payment_status).toBe("Paid");
    expect(row.total).toBe("123456.78");
    expect(row.currency_code).toBe("IRT");
    expect(row.metadata.createdByAdmin).toBe(true);
    expect(row.metadata.adminNotes).toBe("created in test");

    const updated = await saveBookingAction(
      bookingInput({ bookingId, bookingStatus: "Cancelled", paymentStatus: "Refunded", currencyCode: "USD", totalAmount: 5, adminNotes: "edited" }),
    );
    expect(updated.ok).toBe(true);
    const [after] = await db<any[]>`select booking_status, payment_status, currency_code, total_amount::text as total, metadata from booking.bookings where id = ${bookingId}`;
    expect(after.booking_status).toBe("Cancelled");
    expect(after.payment_status).toBe("Refunded");
    expect(after.currency_code).toBe("USD");
    expect(after.total).toBe("5.00");
    expect(after.metadata.createdByAdmin).toBe(true); // merge, not overwrite
    expect(after.metadata.adminNotes).toBe("edited");
  });

  it("refuses a non-admin caller without touching the database", async () => {
    adminState.ctx = { userId: "00000000-0000-4000-8000-0000000000bb", roles: ["customer"], isAdmin: false, isSuperAdmin: false };
    const result = await saveBookingAction(bookingInput());
    expect(result).toEqual({ ok: false, error: { code: "FORBIDDEN", reason: undefined } });
  });

  it("refuses an anonymous caller", async () => {
    adminState.ctx = { userId: undefined as unknown as string, roles: [], isAdmin: false, isSuperAdmin: false };
    const result = await saveBookingAction(bookingInput());
    expect(result.error?.code).toBe("UNAUTHENTICATED");
  });

  it("reports a service of another provider as a validation error", async () => {
    const result = await saveBookingAction(bookingInput({ serviceId: fx.otherServiceId }));
    expect(result.error).toMatchObject({ code: "VALIDATION", reason: "SERVICE_NOT_OF_PROVIDER" });
  });

  it("reports a free-text status as a field validation error, not a server error", async () => {
    const result = await saveBookingAction(bookingInput({ bookingStatus: "whatever" }));
    expect(result.error?.code).toBe("VALIDATION");
    expect(result.error?.fields?.bookingStatus).toBeDefined();
  });

  it("returns NOT_FOUND when updating a booking that does not exist", async () => {
    const result = await saveBookingAction(bookingInput({ bookingId: "00000000-0000-4000-8000-00000000dead" }));
    expect(result.error?.code).toBe("NOT_FOUND");
  });
});

describe("hotel / transfer add-ons", () => {
  it("attaches a hotel stay and a transfer as child bookings, then removes one", async () => {
    const created = await saveBookingAction(bookingInput({ selectedTimeFrom: "05:00", selectedTimeTo: "06:00" }));
    const parentBookingId = created.data!.bookingId;
    createdBookings.push(parentBookingId);

    const hotel = await addHotelStayAddonAction({
      parentBookingId,
      providerId: fx.hotelId,
      checkIn: "2030-01-15",
      checkOut: "2030-01-18",
      rooms: 2,
      adults: 2,
      price: "750.5",
      currencyCode: "EUR",
    });
    expect(hotel.ok).toBe(true);

    const transfer = await addTransferAddonAction({
      parentBookingId,
      routeId,
      date: "2030-01-15",
      time: "08:30",
      passengers: 3,
      price: 40,
      currencyCode: "USD",
    });
    expect(transfer.ok).toBe(true);

    const children = await db<any[]>`
      select id::text, provider_id::text as "providerId", service_id::text as "serviceId", subtotal_amount::text as price, currency,
             selected_date_from::text as "from", selected_date_to::text as "to", selected_time::text as time, adults, rooms, metadata
      from booking.booking_child_bookings where parent_booking_id = ${parentBookingId} order by create_date`;
    expect(children).toHaveLength(2);
    const stay = children.find((c) => c.metadata.addonKind === "hotel_stay");
    const ride = children.find((c) => c.metadata.addonKind === "transfer");
    expect(stay).toMatchObject({ providerId: fx.hotelId, price: "750.50", currency: "EUR", from: "2030-01-15", to: "2030-01-18", rooms: 2 });
    expect(ride).toMatchObject({ providerId: fx.transferProviderId, serviceId: fx.transferServiceId, price: "40.00", time: "08:30:00", adults: 3 });

    // Removing with the wrong parent id must not delete anything.
    const wrongParent = await removeChildBookingAction({ parentBookingId: "00000000-0000-4000-8000-00000000dead", childBookingId: ride.id });
    expect(wrongParent.error?.code).toBe("NOT_FOUND");

    const removed = await removeChildBookingAction({ parentBookingId, childBookingId: ride.id });
    expect(removed.ok).toBe(true);
    const [{ count }] = await db<{ count: number }[]>`select count(*)::int as count from booking.booking_child_bookings where parent_booking_id = ${parentBookingId}`;
    expect(count).toBe(1);
  });

  it("rejects check-out before check-in and an unknown route", async () => {
    const parentBookingId = createdBookings[0];
    const badStay = await addHotelStayAddonAction({ parentBookingId, providerId: fx.hotelId, checkIn: "2030-01-18", checkOut: "2030-01-15", price: 1, currencyCode: "USD" });
    expect(badStay.error?.fields?.checkOut).toEqual(["CHECKOUT_BEFORE_CHECKIN"]);

    const badRoute = await addTransferAddonAction({ parentBookingId, routeId: "00000000-0000-4000-8000-00000000dead", date: "2030-01-15", price: 1, currencyCode: "USD" });
    expect(badRoute.error).toMatchObject({ code: "VALIDATION", reason: "ROUTE_NOT_FOUND" });
  });

  it("refuses add-on changes from a non-admin", async () => {
    adminState.ctx = { userId: "00000000-0000-4000-8000-0000000000bb", roles: ["customer"], isAdmin: false, isSuperAdmin: false };
    const result = await removeChildBookingAction({ parentBookingId: createdBookings[0], childBookingId: "00000000-0000-4000-8000-00000000dead" });
    expect(result.error?.code).toBe("FORBIDDEN");
  });
});
