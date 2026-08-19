# Batch 32 — Class & Group Session Studio

## Customer problem
LSevin providers can publish services, availability and memberships, but recurring classes and group sessions still require spreadsheets and messaging to manage capacity, waitlists, dependents, payments and attendance. Customers also lack one secure place to enroll themselves or household members and respond to waitlist offers.

## Delivered
- Moderated provider class profile and public safety/cancellation notices.
- Programs for fitness classes, wellness groups, workshops, group consultations, therapy groups, education, tours, courses and custom sessions.
- Recurring or one-off session instances with timezone, location/online instructions, instructor references, booking deadline and cancellation deadline.
- Capacity-safe enrollment with row locking and active-seat accounting.
- Bounded waitlists and expiring seat-promotion offers.
- Customer and household/dependent participants with minor and guardian verification.
- Optional membership, booking, invoice and payment references through generic fields or Core ModuleBus.
- Customer responses for enrollment, payment request, waitlist acceptance, cancellation, decline and help.
- Provider attendance, no-show and cancellation management with customer-safe activity history.
- Provider workspace, admin supervision page, public customer page and stable LSevin web/mobile bridge.
- Notification templates through Core ModuleBus.
- Launch-readiness key `class_group_studio_ready`.

## Architecture
- Standalone folder: `src/modules/class-group-studio`
- Depends only on Core.
- Booking, membership, household, billing and notification modules remain optional and are referenced only through generic entity references or Core ModuleBus.
