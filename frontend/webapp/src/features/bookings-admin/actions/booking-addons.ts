"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/features/booking-admin-shared/server/db";

import { HotelStayAddonSchema, RemoveChildBookingSchema, TransferAddonSchema } from "../schemas";
import { AdminActionError, requireBookingAdmin, runAdminAction, type AdminActionResult } from "./action-result";

/*
 * Hotel stays and transfers attached to a booking are child bookings
 * (booking.booking_child_bookings, parent_booking_id → booking.bookings) — the same rows
 * checkout writes for add-ons a customer picks. Admin-attached ones carry
 * metadata.createdByAdmin and the admin's price in subtotal_amount; no availability or
 * price-list check is applied. The parent booking's total is not changed here.
 */

async function assertParentExists(parentBookingId: string) {
  const [parent] = await db<{ id: string }[]>`select id::text as id from booking.bookings where id = ${parentBookingId} limit 1`;
  if (!parent) throw new AdminActionError("NOT_FOUND");
}

function revalidateBooking(parentBookingId: string) {
  revalidatePath(`/admin/bookings/${parentBookingId}/update`);
  revalidatePath("/admin/bookings");
}

export async function addHotelStayAddonAction(input: unknown): Promise<AdminActionResult<{ childBookingId: string }>> {
  return runAdminAction("addHotelStayAddonAction", async () => {
    const admin = await requireBookingAdmin();
    const values = HotelStayAddonSchema.parse(input);
    await assertParentExists(values.parentBookingId);

    const [provider] = await db<{ providerTypeId: string | null }[]>`
      select provider_type_id::text as "providerTypeId"
      from category.service_providers
      where id = ${values.providerId}
      limit 1
    `;
    if (!provider) throw new AdminActionError("VALIDATION", "HOTEL_NOT_FOUND");
    if (!provider.providerTypeId) throw new AdminActionError("VALIDATION", "HOTEL_HAS_NO_PROVIDER_TYPE");

    if (values.serviceId) {
      const [room] = await db<{ id: string }[]>`
        select id::text as id from category.provider_services
        where id = ${values.serviceId} and service_provider_id = ${values.providerId}
        limit 1
      `;
      if (!room) throw new AdminActionError("VALIDATION", "ROOM_NOT_OF_HOTEL");
    }

    const metadata = {
      addonKind: "hotel_stay",
      selectedDateFrom: values.checkIn,
      selectedDateTo: values.checkOut,
      adminNote: values.note ?? "",
      createdByAdmin: true,
      createdByAdminUserId: admin.userId,
      createdByAdminAt: new Date().toISOString(),
    };

    const [row] = await db<{ id: string }[]>`
      insert into booking.booking_child_bookings (
        parent_booking_id, provider_type_id, provider_id, service_id,
        selected_date, selected_date_from, selected_date_to,
        adults, children, rooms,
        booking_ui_mode, subtotal_amount, currency, status, metadata
      ) values (
        ${values.parentBookingId}, ${provider.providerTypeId}, ${values.providerId}, ${values.serviceId ?? null},
        ${values.checkIn}, ${values.checkIn}, ${values.checkOut},
        ${values.adults ?? null}, ${values.children ?? null}, ${values.rooms},
        'date_range', ${values.price}, ${values.currencyCode}, ${values.status},
        ${db.json(metadata as unknown as Record<string, never>)}
      )
      returning id::text as id
    `;

    revalidateBooking(values.parentBookingId);
    return { childBookingId: row.id };
  });
}

export async function addTransferAddonAction(input: unknown): Promise<AdminActionResult<{ childBookingId: string }>> {
  return runAdminAction("addTransferAddonAction", async () => {
    const admin = await requireBookingAdmin();
    const values = TransferAddonSchema.parse(input);
    await assertParentExists(values.parentBookingId);

    const [route] = await db<{ providerId: string; serviceId: string; providerTypeId: string | null }[]>`
      select r.service_provider_id::text as "providerId",
             r.provider_service_id::text as "serviceId",
             sp.provider_type_id::text as "providerTypeId"
      from transfer.routes r
      join category.service_providers sp on sp.id = r.service_provider_id
      where r.id = ${values.routeId}
      limit 1
    `;
    if (!route) throw new AdminActionError("VALIDATION", "ROUTE_NOT_FOUND");
    if (!route.providerTypeId) throw new AdminActionError("VALIDATION", "ROUTE_PROVIDER_HAS_NO_TYPE");

    const metadata = {
      addonKind: "transfer",
      transferRouteId: values.routeId,
      passengers: values.passengers,
      adminNote: values.note ?? "",
      createdByAdmin: true,
      createdByAdminUserId: admin.userId,
      createdByAdminAt: new Date().toISOString(),
    };

    const [row] = await db<{ id: string }[]>`
      insert into booking.booking_child_bookings (
        parent_booking_id, provider_type_id, provider_id, service_id,
        selected_date, selected_time, adults,
        booking_ui_mode, subtotal_amount, currency, status, metadata
      ) values (
        ${values.parentBookingId}, ${route.providerTypeId}, ${route.providerId}, ${route.serviceId},
        ${values.date}, ${values.time ?? null}, ${values.passengers},
        'default_slot', ${values.price}, ${values.currencyCode}, ${values.status},
        ${db.json(metadata as unknown as Record<string, never>)}
      )
      returning id::text as id
    `;

    revalidateBooking(values.parentBookingId);
    return { childBookingId: row.id };
  });
}

export async function removeChildBookingAction(input: unknown): Promise<AdminActionResult<{ removed: true }>> {
  return runAdminAction("removeChildBookingAction", async () => {
    await requireBookingAdmin();
    const values = RemoveChildBookingSchema.parse(input);

    // Scoped by parent so a forged id can never delete another booking's child row.
    // Charge/refund lines cascade with the row; ledger/settlement rows keep it as null.
    const deleted = await db<{ id: string }[]>`
      delete from booking.booking_child_bookings
      where id = ${values.childBookingId}
        and parent_booking_id = ${values.parentBookingId}
      returning id::text as id
    `;
    if (!deleted.length) throw new AdminActionError("NOT_FOUND");

    revalidateBooking(values.parentBookingId);
    return { removed: true as const };
  });
}
