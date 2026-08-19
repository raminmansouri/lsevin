# Batch 15 — Boost Studio

Boost Studio is a customer-growth module for LSevin Providers Portal. It gives providers and staff Instagram-like business boosting tools inside LSevin without breaking the modular architecture.

## Customer value

- Customers see LSevin-reviewed promoted providers, service launches and CTAs inside the LSevin front/app.
- Customers can save, share, follow, click CTA or send a booking guidance request from a promoted surface.
- Providers can grow without pushing customers out to Instagram or WhatsApp.

## Provider/admin value

- Providers plan boost campaigns with objective, placement, audience, budget, schedule and CTA.
- LSevin admin approves, pauses or rejects campaigns before public display.
- Approved campaigns can issue a PaymentBilling invoice through Core ModuleBus.
- Boost events and leads flow into provider/admin consoles.

## Public contracts

- `GET /api/public/providers/:providerId/boosts`
- `POST /api/public/providers/:providerId/boost-events`
- `POST /api/public/providers/:providerId/boost-requests`

## Architecture

- Module folder: `src/modules/boost-studio`
- Database schema: `boost_studio`
- Depends only on Core.
- Payment and notification interactions use Core ModuleBus capabilities:
  - `billing.issue_invoice`
  - `notifications.emit_from_lsevin`
- Provider launch readiness includes `boost_studio_ready`.
