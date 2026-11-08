import "server-only";

import { z } from "zod";

import { getBookingAvailableTimeSlotsFromDb } from "@/features/booking-pro/server/booking-availability.repository";
import { resolveBookingEntry } from "@/features/booking-pro/server/booking-entry.repository";

export const START_BOOKING_DESCRIPTION =
  "Prepare a booking for one LSevin service and give the user a link to finish it on the booking page " +
  "(where they review the price, sign in if needed, and pay). It does NOT book or charge anything. " +
  "Before calling it, confirm the details with the user in one short sentence (service, clinic, doctor if any, date and time). " +
  "Use a date and time returned by get_availability. If it says the time is taken, offer the alternatives it returns. " +
  "Show the returned bookingUrl as a link titled with the words 'complete booking' in the user's language, " +
  "and never say the booking is done: the user still has to confirm and pay on that page.";

export const startBookingInputSchema = z.object({
  serviceId: z.string().uuid().describe("The service id (a treatment at a specific clinic)."),
  specialistId: z.string().uuid().optional().describe("The doctor/specialist id, if the user chose one."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Chosen day (YYYY-MM-DD, Gregorian), from get_availability."),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().describe("Chosen start time (HH:MM), from get_availability."),
});

export type StartBookingInput = z.infer<typeof startBookingInputSchema>;

export async function startBooking(input: StartBookingInput, storedLocale: string) {
  // The same lookup the booking page does, so names and prices match what the user will see.
  const entry = await resolveBookingEntry({
    locale: storedLocale,
    serviceId: input.serviceId,
    specialistId: input.specialistId,
  });
  const service = entry.services.find((item) => item.id === input.serviceId);
  if (!service) return { ok: false as const, reason: "service_not_bookable" };
  const provider = entry.providers.find((item) => item.id === service.providerId) ?? null;
  const specialist = input.specialistId
    ? (entry.specialists.find((item) => item.id === input.specialistId) ?? null)
    : null;

  // The chosen time may have been taken since get_availability: check again.
  if (input.date && input.time) {
    const { timeSlots } = await getBookingAvailableTimeSlotsFromDb({
      selectedDate: input.date,
      providerId: service.providerId,
      serviceId: input.serviceId,
      specialistId: input.specialistId,
      locale: storedLocale,
    });
    const free = (timeSlots as Array<{ time?: string; available?: boolean }>)
      .filter((slot) => slot.available !== false && slot.time)
      .map((slot) => String(slot.time).slice(0, 5));
    if (!free.includes(input.time)) {
      return { ok: false as const, reason: "time_taken", date: input.date, alternatives: free.slice(0, 8) };
    }
  }

  const params = new URLSearchParams({ providerId: service.providerId, serviceId: input.serviceId });
  if (input.specialistId) params.set("specialistId", input.specialistId);
  if (input.date) params.set("date", input.date);
  if (input.time) params.set("time", input.time);

  return {
    ok: true as const,
    bookingUrl: `/n/app/mobile/booking?${params.toString()}`,
    summary: {
      service: service.name,
      clinic: provider?.name ?? null,
      city: provider?.city ?? null,
      specialist: specialist?.name ?? null,
      date: input.date ?? null,
      time: input.time ?? null,
      durationMinutes: service.durationMinutes,
      price: service.price,
      currency: service.currency,
    },
    note: "Not booked yet: the user confirms the details and pays on the booking page.",
  };
}