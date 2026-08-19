# vNext Batch 9 — Conversion Studio

## Purpose
Batch 9 adds LSevin-native conversion tools for providers and staff. After business growth, audience, referral and content tools, providers need a way to turn attention into moderated offers, consultation requests and booking-intent leads inside LSevin.

## Customer value
- Customers see approved offers and clear CTAs on the provider page.
- Customers can claim an offer or request booking guidance without leaving LSevin.
- LSevin moderates claims and promises before public display.
- Providers/staff can follow up hot conversion requests from one console.

## Architecture
- Standalone module: `src/modules/conversion-studio`.
- Depends only on Core.
- Uses Core ModuleBus for notifications through `notifications.emit_from_lsevin`.
- Public front contract exposed through `/api/public/providers/:providerId/conversion-profile`.

## Launch readiness
Provider launch readiness now includes `conversion_studio_ready`.
