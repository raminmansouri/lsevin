/**
 * Server-side stay quote (H03, H05, H07). Canonical inputs only: ISO dates,
 * integer guest counts and child ages. Amounts are computed in minor units of
 * the property currency, so totals never drift by floating-point rounding.
 *
 * Per room and night:
 *   nightly rate (dated override or the plan's base price) covers
 *   `baseOccupancy` guests. Infants (< 2) are free and take no place.
 *   Children younger than the property's free age are free but take a place.
 *   Remaining places of the base occupancy are filled by adults first, then
 *   paying children; every guest beyond it pays extra_adult_price / child_price.
 * Then: long-stay discount on rooms, property tax, platform service fee.
 */
import { nightsBetween, stayNights } from "./dates";

export const INFANT_MAX_AGE = 1;

export type RoomCapacity = {
  baseOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  units: number;
};

export type RatePlanPricing = {
  id: string;
  basePrice: number;
  extraAdultPrice: number;
  childPrice: number;
  minNights: number;
  maxNights: number;
  longStayNights: number | null;
  longStayPercent: number | null;
};

export type Occupancy = { rooms: number; adults: number; childAges: number[] };

export type RoomAllocation = { adults: number; childAges: number[] };

export class StayQuoteError extends Error {
  constructor(
    public readonly code:
      | "invalid_occupancy"
      | "adult_per_room_required"
      | "too_many_rooms"
      | "too_many_adults"
      | "too_many_children"
      | "over_capacity"
      | "min_nights"
      | "max_nights"
      | "invalid_dates",
  ) {
    super(code);
    this.name = "StayQuoteError";
  }
}

export function validateOccupancy(o: Occupancy, limits: { maxRooms: number }): void {
  if (!Number.isInteger(o.rooms) || !Number.isInteger(o.adults) || o.rooms < 1 || o.adults < 1) throw new StayQuoteError("invalid_occupancy");
  if (o.childAges.some((a) => !Number.isInteger(a) || a < 0 || a > 17)) throw new StayQuoteError("invalid_occupancy");
  if (o.rooms > limits.maxRooms) throw new StayQuoteError("too_many_rooms");
  if (o.adults < o.rooms) throw new StayQuoteError("adult_per_room_required");
  if (o.adults > 30 * o.rooms || o.childAges.length > 20 * o.rooms) throw new StayQuoteError("invalid_occupancy");
}

/**
 * Spreads guests over rooms as evenly as possible: adults round-robin, then
 * children (oldest first) into the room with the fewest occupants so far.
 */
export function allocateRooms(o: Occupancy): RoomAllocation[] {
  const rooms: RoomAllocation[] = Array.from({ length: o.rooms }, () => ({ adults: 0, childAges: [] }));
  for (let i = 0; i < o.adults; i++) rooms[i % o.rooms].adults += 1;
  const counted = (r: RoomAllocation) => r.adults + r.childAges.filter((a) => a > INFANT_MAX_AGE).length;
  for (const age of [...o.childAges].sort((a, b) => b - a)) {
    let target = 0;
    for (let i = 1; i < rooms.length; i++) if (counted(rooms[i]) < counted(rooms[target])) target = i;
    rooms[target].childAges.push(age);
  }
  return rooms;
}

/** Throws when one room's guests do not fit the room type. */
export function checkRoomFits(room: RoomAllocation, cap: RoomCapacity): void {
  const children = room.childAges.filter((a) => a > INFANT_MAX_AGE).length;
  if (room.adults > cap.maxAdults) throw new StayQuoteError("too_many_adults");
  if (children > cap.maxChildren) throw new StayQuoteError("too_many_children");
  if (room.adults + children > cap.maxOccupancy) throw new StayQuoteError("over_capacity");
}

/** Does this occupancy fit `rooms` units of the room type at all? */
export function occupancyFits(o: Occupancy, cap: RoomCapacity): boolean {
  if (o.rooms > cap.units) return false;
  try {
    for (const room of allocateRooms(o)) checkRoomFits(room, cap);
    return true;
  } catch {
    return false;
  }
}

export type StayQuoteLine = {
  kind: "room_night" | "extra_adult" | "child" | "long_stay_discount" | "tax" | "service_fee";
  date?: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type StayQuote = {
  currency: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  childAges: number[];
  lines: StayQuoteLine[];
  nightly: { date: string; amount: number }[];
  roomsSubtotal: number;
  discount: number;
  tax: number;
  fees: number;
  total: number;
  /** Average per night for the whole party, for "x per night" display. */
  perNight: number;
};

export type QuoteInput = {
  currency: string;
  currencyDecimals: number;
  checkIn: string;
  checkOut: string;
  occupancy: Occupancy;
  capacity: RoomCapacity;
  rate: RatePlanPricing;
  /** ISO date → nightly price overriding rate.basePrice. */
  overrides?: Record<string, number>;
  childFreeUnderAge: number;
  taxPercent: number;
  serviceFeePercent: number;
  maxRooms?: number;
};

export function quoteStay(input: QuoteInput): StayQuote {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (!(nights >= 1)) throw new StayQuoteError("invalid_dates");
  if (nights < input.rate.minNights) throw new StayQuoteError("min_nights");
  if (nights > input.rate.maxNights) throw new StayQuoteError("max_nights");
  validateOccupancy(input.occupancy, { maxRooms: input.maxRooms ?? 5 });
  if (input.occupancy.rooms > input.capacity.units) throw new StayQuoteError("too_many_rooms");

  const scale = 10 ** input.currencyDecimals;
  const minor = (v: number) => Math.round(v * scale);
  const major = (v: number) => v / scale;

  const allocation = allocateRooms(input.occupancy);
  let extraAdults = 0;
  let payingChildren = 0;
  for (const room of allocation) {
    checkRoomFits(room, input.capacity);
    // Children under the free age (and infants) cost nothing; only older children can be charged.
    const paidChildren = room.childAges.filter((a) => a >= input.childFreeUnderAge).length;
    const baseLeftAfterAdults = Math.max(0, input.capacity.baseOccupancy - room.adults);
    extraAdults += Math.max(0, room.adults - input.capacity.baseOccupancy);
    payingChildren += Math.max(0, paidChildren - baseLeftAfterAdults);
  }

  const lines: StayQuoteLine[] = [];
  const nightly: { date: string; amount: number }[] = [];
  let roomsMinor = 0;
  for (const date of stayNights(input.checkIn, input.checkOut)) {
    const priceMinor = minor(input.overrides?.[date] ?? input.rate.basePrice);
    const amount = priceMinor * input.occupancy.rooms;
    roomsMinor += amount;
    lines.push({ kind: "room_night", date, quantity: input.occupancy.rooms, unitAmount: major(priceMinor), amount: major(amount) });
    nightly.push({ date, amount: major(amount) });
  }
  if (extraAdults > 0 && input.rate.extraAdultPrice > 0) {
    const amount = minor(input.rate.extraAdultPrice) * extraAdults * nights;
    roomsMinor += amount;
    lines.push({ kind: "extra_adult", quantity: extraAdults * nights, unitAmount: input.rate.extraAdultPrice, amount: major(amount) });
  }
  if (payingChildren > 0 && input.rate.childPrice > 0) {
    const amount = minor(input.rate.childPrice) * payingChildren * nights;
    roomsMinor += amount;
    lines.push({ kind: "child", quantity: payingChildren * nights, unitAmount: input.rate.childPrice, amount: major(amount) });
  }

  let discountMinor = 0;
  if (input.rate.longStayNights && input.rate.longStayPercent && nights >= input.rate.longStayNights) {
    discountMinor = Math.round((roomsMinor * input.rate.longStayPercent) / 100);
    lines.push({ kind: "long_stay_discount", quantity: 1, unitAmount: -major(discountMinor), amount: -major(discountMinor) });
  }
  const afterDiscount = roomsMinor - discountMinor;
  const taxMinor = input.taxPercent > 0 ? Math.round((afterDiscount * input.taxPercent) / 100) : 0;
  if (taxMinor > 0) lines.push({ kind: "tax", quantity: 1, unitAmount: major(taxMinor), amount: major(taxMinor) });
  const feeMinor = input.serviceFeePercent > 0 ? Math.round((afterDiscount * input.serviceFeePercent) / 100) : 0;
  if (feeMinor > 0) lines.push({ kind: "service_fee", quantity: 1, unitAmount: major(feeMinor), amount: major(feeMinor) });
  const totalMinor = afterDiscount + taxMinor + feeMinor;

  return {
    currency: input.currency,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    rooms: input.occupancy.rooms,
    adults: input.occupancy.adults,
    childAges: [...input.occupancy.childAges],
    lines,
    nightly,
    roomsSubtotal: major(roomsMinor),
    discount: major(discountMinor),
    tax: major(taxMinor),
    fees: major(feeMinor),
    total: major(totalMinor),
    perNight: major(Math.round(totalMinor / nights)),
  };
}
