import "server-only";

import { z } from "zod";

import {
  getBookingAvailableDatesFromDb,
  getBookingAvailableTimeSlotsFromDb,
} from "@/features/booking-pro/server/booking-availability.repository";

export const GET_AVAILABILITY_DESCRIPTION =
  "Get the free appointment times of one LSevin service (a treatment at a specific clinic), optionally with a specific doctor/specialist. " +
  "Use the service id from search_services (type: service) or get_service_details, and the specialist id from get_service_details if the user " +
  "wants a specific doctor. Pass a date (YYYY-MM-DD) for one day's times, or leave it out to get the next days that have free times. " +
  "These are exactly the times the booking page shows, in the clinic's local time. Never invent or guess times.";

export const getAvailabilityInputSchema = z.object({
  serviceId: z.guid().describe("The service id (a treatment at a specific clinic)."),
  specialistId: z.guid().optional().describe("A specific doctor/specialist, if the user asked for one."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("One day (YYYY-MM-DD, Gregorian). Leave out to get the next available days."),
  days: z.number().int().min(1).max(30).optional().describe("How many days ahead to look when no date is given. Default 14."),
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilityInputSchema>;

const MAX_DAYS_WITH_TIMES = 3;
const MAX_TIMES_PER_DAY = 8;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};

/** The free start times of one day ("10:30", …), as the booking page shows them. */
async function freeTimes(input: GetAvailabilityInput, date: string, locale: string): Promise<string[]> {
  const { timeSlots } = await getBookingAvailableTimeSlotsFromDb({
    selectedDate: date,
    serviceId: input.serviceId,
    specialistId: input.specialistId,
    locale,
  });
  return (timeSlots as Array<{ time?: string; available?: boolean }>)
    .filter((slot) => slot.available !== false && slot.time)
    .map((slot) => String(slot.time).slice(0, 5));
}

export async function getAvailability(input: GetAvailabilityInput, storedLocale: string) {
  // One specific day.
  if (input.date) {
    const times = await freeTimes(input, input.date, storedLocale);
    return { serviceId: input.serviceId, specialistId: input.specialistId ?? null, days: [{ date: input.date, times }] };
  }

  // The next days that have free times, with the times of the first few.
  const today = new Date().toISOString().slice(0, 10);
  const { dates } = await getBookingAvailableDatesFromDb({
    serviceId: input.serviceId,
    specialistId: input.specialistId,
    startDate: today,
    endDate: addDays(new Date(`${today}T00:00:00Z`), input.days ?? 14),
    locale: storedLocale,
    calendar: "gregory",
  });
  const openDates = (dates as Array<{ date?: string; available?: boolean }>)
    .filter((day) => day.available !== false && day.date)
    .map((day) => String(day.date).slice(0, 10));

  const days = [];
  for (const date of openDates.slice(0, MAX_DAYS_WITH_TIMES)) {
    const times = await freeTimes(input, date, storedLocale);
    if (times.length) days.push({ date, times: times.slice(0, MAX_TIMES_PER_DAY), more: times.length > MAX_TIMES_PER_DAY });
  }

  return {
    serviceId: input.serviceId,
    specialistId: input.specialistId ?? null,
    days,
    otherOpenDates: openDates.slice(MAX_DAYS_WITH_TIMES),
    note: days.length ? "Times are in the clinic's local time." : "No free times in this period.",
  };
}