# Booking-pro integration notes

## 1) Booking page entry URLs

The booking page should accept any of these entry URLs:

```txt
/:locale/n/app/mobile/booking?serviceId=<provider_service_id>
/:locale/n/app/mobile/booking?specialistId=<staff_id>
/:locale/n/app/mobile/booking?providerId=<service_provider_id>
/:locale/n/app/mobile/booking?providerId=<id>&serviceId=<id>&specialistId=<id>
```

In the booking page client component:

```tsx
import { useSearchParams } from "next/navigation";
import { parseBookingUrlSelection } from "@/features/booking-pro/lib/url-selection";
import { resolveBookingEntryAction } from "@/features/booking-pro/actions/resolve-booking-entry";

const searchParams = useSearchParams();
const initialSelection = parseBookingUrlSelection(searchParams);

// Then call resolveBookingEntryAction(initialSelection) once on page load.
// The response gives selectedProviderId, selectedServiceId, selectedSpecialistId,
// plus the related providers/services/specialists to render in step 1.
```

This lets the user arrive from service detail, specialist detail, or provider detail. The booking page resolves the missing parts from PostgreSQL.

## 2) Step 2 schedule source

Use:

```ts
getBookingAvailableDatesAction({ providerId, serviceId, specialistId, calendar })
getBookingAvailableTimeSlotsAction({ selectedDate, providerId, serviceId, specialistId })
```

The repository uses:

- `provider_portal.provider_operating_hours` for provider opening/closing windows.
- `category.staff_availabilities` when a specialist is selected.
- `booking.bookings` to block already reserved `Pending` / `Confirmed` slots.
- `category.provider_services.slot_interval_minutes` and duration columns for slot generation.

## 3) Persian / Jalali display

Use:

```ts
import { formatBookingDate, formatBookingDateTime, parseBookingCalendarDate } from "@/features/booking-pro/lib/calendar";

formatBookingDate("2026-04-30", { locale: "fa-IR", calendar: "jalali" });
formatBookingDateTime("2026-04-30", "13:30", { locale: "fa-IR", calendar: "jalali" });
```

The database should continue storing `booking.bookings.selected_date` as PostgreSQL `date` in Gregorian ISO format. Jalali is a presentation/input calendar, not a second persisted date column.

## 4) Admin calendar support

Run:

```sql
src/features/booking-pro/db/migrations/20260430_create_booking_calendar_settings.sql
```

Admin page:

```txt
/:locale/admin/booking-calendar
```

Add this route to your admin sidebar manually if your central menu is outside this zip.
