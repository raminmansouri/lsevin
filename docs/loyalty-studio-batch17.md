# vNext Batch 17 — Loyalty Studio

## Goal

Add LSevin-native provider/staff club tools so providers can turn attention and bookings into repeat customer relationships without pushing users to Instagram, WhatsApp or unmanaged lists.

## Customer-facing capabilities

- Public provider club page
- Approved member tiers
- Approved perks and benefit cards
- Join club flow with preferred notification channel
- Perk claim flow
- Save/share/CTA/booking-intent event tracking

## Provider/Admin capabilities

- Provider loyalty profile
- Tier and perk composer
- Admin approve/reject moderation
- Member list and claim supervision
- Launch-readiness score `loyalty_studio_ready`

## Architecture

- Standalone module folder: `src/modules/loyalty-studio`
- Depends only on Core
- Notifications via Core ModuleBus `notifications.emit_from_lsevin`
- Public-safe DTOs for LSevin front/mobile

## LSevin front bridge

- `webapp-loyalty-studio-bridge-patch/src/lib/providerPortalLoyaltyStudioBridge.ts`
