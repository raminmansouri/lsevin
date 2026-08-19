# Batch 62 — Multilingual onboarding landing report

Release: `v1.0.0-rc.25`

## Delivered

- Replaced generic `UiText` phrase fallback on provider and staff public landing pages with a module-owned complete dictionary.
- Added complete copy for Persian, English, Arabic, Turkish, Spanish, Kurdish, German and French.
- Added a public language switcher that works before authentication.
- Added RTL-aware action direction and locale-derived document language/direction.
- Localized provider and staff hero copy, trust statements, progress examples, onboarding steps, feature explanations, closing calls to action and authentication guidance.
- Localized root page title and description without introducing a Core-to-module dependency.
- Updated the onboarding manifest to version `2.4.0` and declared all eight locales.
- Added static QA and production route smoke tests for both public landing routes in every locale.

## Boundaries

This batch does not claim that the authenticated provider application form, staff application form or administrator review pages have complete module-owned dictionaries. They remain the next P0 onboarding localization pass.

No database migration or public API contract was changed.
