# Portal experience surface audit

The audit is generated from the current platform-aligned release profile; only the 24 supported module folders exist in source.

## Summary

- Registered module folders: **24**
- Production main-use-case modules complete: **24**
- Production release gaps: **0**
- Modules disabled by the release profile: **0**
- Raw country/city/currency references found: **0**
- Legacy per-language inputs found: **0**
- Raw media URL fields found: **0**

## Release integration

- Core locale configuration follows LSevin: Persian default, English fallback, eight supported locales, RTL awareness and NEXT_LOCALE persistence.
- Core searchable reference selectors read finance.currencies and category.locations.
- Core localized input/textarea/rich-text fields store all eight locale headers.
- Core media picker reads media.media_library and enforces provider ownership.
- Finance, billing, notification templates and staff workflows use the shared release primitives.

## Module inventory

| Module | Status | Reference fields | Localized fields | Media URL fields | Hard-coded locale fields |
|---|---|---:|---:|---:|---:|
| admin-governance | main-use-case-complete | 0 | 0 | 0 | 0 |
| availability | main-use-case-complete | 0 | 0 | 0 | 0 |
| booking-management | main-use-case-complete | 0 | 0 | 0 | 0 |
| bookings | main-use-case-complete | 0 | 0 | 0 | 0 |
| dashboard | main-use-case-complete | 0 | 0 | 0 | 0 |
| finance | main-use-case-complete | 0 | 0 | 0 | 0 |
| manage | main-use-case-complete | 0 | 0 | 0 | 0 |
| media | main-use-case-complete | 0 | 0 | 0 | 0 |
| media-library | main-use-case-complete | 0 | 0 | 0 | 0 |
| notifications-module | main-use-case-complete | 0 | 0 | 0 | 0 |
| offers | main-use-case-complete | 0 | 0 | 0 | 0 |
| onboarding | main-use-case-complete | 0 | 0 | 0 | 0 |
| payment-billing | main-use-case-complete | 0 | 0 | 0 | 0 |
| provider-access | main-use-case-complete | 0 | 0 | 0 | 0 |
| provider-finance-analytics | main-use-case-complete | 0 | 0 | 0 | 0 |
| provider-portal | main-use-case-complete | 0 | 0 | 0 | 0 |
| providers | main-use-case-complete | 0 | 0 | 0 | 0 |
| reporting-analytics | main-use-case-complete | 0 | 0 | 0 | 0 |
| reviews | main-use-case-complete | 0 | 0 | 0 | 0 |
| reviews-standalone | main-use-case-complete | 0 | 0 | 0 | 0 |
| services | main-use-case-complete | 0 | 0 | 0 | 0 |
| staff | main-use-case-complete | 0 | 0 | 0 | 0 |
| support | main-use-case-complete | 0 | 0 | 0 | 0 |
| ticketing | main-use-case-complete | 0 | 0 | 0 | 0 |
