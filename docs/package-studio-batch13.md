# vNext Batch 13 — Package Studio

## Goal

Add LSevin-native service/treatment package tools so providers and staff can package services, optional add-ons, travel support, interpreter support, hotel/transfer, care journey and custom quote requests inside LSevin.

## Customer value

- Customers can compare package inclusions and price ranges before booking.
- Customers can request a package or custom quote without going to WhatsApp/Instagram.
- Providers can present structured packages instead of unclear free-text offers.
- LSevin admin moderates package claims before public exposure.

## Architecture

- Standalone module: `src/modules/package-studio`
- Depends only on Core.
- Uses Core ModuleBus for notifications.
- Public APIs are safe for LSevin front/mobile.
- Launch readiness includes `package_studio_ready`.

## External gates

- Wire package bridge helper into LSevin front/mobile.
- Run staging UAT with real provider/package data.
- Validate pricing copy and eligibility text with operations before paid acquisition.
