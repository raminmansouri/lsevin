import { describe, expect, it } from "vitest";

import { BookingFormSchema, HotelStayAddonSchema, TransferAddonSchema } from "./index";

const base = {
  providerId: "00000000-0000-4000-8000-000000000001",
  serviceId: "00000000-0000-4000-8000-000000000002",
  paymentMethod: "bank",
  bookingStatus: "Confirmed",
};

describe("BookingFormSchema", () => {
  it("accepts any price and empty optional fields (admin override)", () => {
    const parsed = BookingFormSchema.parse({ ...base, userId: "", specialistId: "", selectedDate: "", totalAmount: "987654.32" });
    expect(parsed.userId).toBeNull();
    expect(parsed.specialistId).toBeNull();
    expect(parsed.selectedDate).toBeNull();
    expect(parsed.totalAmount).toBe(987654.32);
  });

  // Regression: status/payment status used to be free-text inputs, so a typo saved a status no screen understood.
  it("rejects booking statuses outside the enum", () => {
    expect(BookingFormSchema.safeParse({ ...base, bookingStatus: "confirmd" }).success).toBe(false);
    expect(BookingFormSchema.safeParse({ ...base, bookingStatus: "" }).success).toBe(false);
    expect(BookingFormSchema.safeParse({ ...base, paymentStatus: "NotRequired" }).success).toBe(true);
  });

  it("rejects an end time not after the start time (the table's ck_bookings_time_range)", () => {
    const result = BookingFormSchema.safeParse({ ...base, selectedTimeFrom: "11:00", selectedTimeTo: "10:00" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("END_BEFORE_START");
  });

  it("rejects negative amounts and counts", () => {
    expect(BookingFormSchema.safeParse({ ...base, totalAmount: -1 }).success).toBe(false);
    expect(BookingFormSchema.safeParse({ ...base, adults: -1 }).success).toBe(false);
  });
});

describe("add-on schemas", () => {
  const parentBookingId = "00000000-0000-4000-8000-000000000003";

  it("requires check-out after check-in for a hotel stay", () => {
    const result = HotelStayAddonSchema.safeParse({
      parentBookingId,
      providerId: base.providerId,
      checkIn: "2026-12-04",
      checkOut: "2026-12-01",
      price: 10,
      currencyCode: "USD",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("CHECKOUT_BEFORE_CHECKIN");
  });

  it("defaults a transfer to one passenger and Confirmed", () => {
    const parsed = TransferAddonSchema.parse({
      parentBookingId,
      routeId: base.providerId,
      date: "2026-12-01",
      time: "",
      price: "40",
      currencyCode: "USD",
    });
    expect(parsed.passengers).toBe(1);
    expect(parsed.status).toBe("Confirmed");
    expect(parsed.time).toBeNull();
  });
});
