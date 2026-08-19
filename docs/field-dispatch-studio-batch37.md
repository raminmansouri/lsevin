# Batch 37 — Home Service Dispatch & Field Visit Studio

## Customer problem

Bookings and check-in do not cover the full home-service or mobile-service journey. Customers need a protected place to confirm the appointment window, share access and practical needs, follow field-team status, request help or reschedule, and confirm arrival or completion.

## Delivered

- Moderated provider dispatch policy and reusable preparation templates.
- Protected field visits for home service, mobile consultation, pickup, delivery, transport, inspection, installation, sample collection and custom journeys.
- Hash-only access and contact matching keys.
- Customer appointment-window confirmation and address/instruction updates.
- Companion, accessibility, language, parking, pet and safety instructions.
- Provider team/user assignment, vehicle label, ETA window, optional generic route reference and tracking link.
- Atomic provider/day dispatch-number allocation with a PostgreSQL advisory transaction lock.
- Blocking preparation tasks before en-route, arrival or service start.
- Protected generic proof references and verified-proof completion gate.
- Customer reschedule, cancellation, help, not-arrived, arrival confirmation and completion confirmation.
- Provider dispatch board, admin risk queue, notification templates and launch-readiness evidence.
- Stable LSevin web/mobile bridge.

## Architecture

The module is self-contained in `src/modules/field-dispatch-studio`, depends only on Core and uses generic references or Core ModuleBus capabilities for booking, staff, route/maps, payment, document, consent, household and media integration.
