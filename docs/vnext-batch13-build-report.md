# vNext Batch 13 Build Report — Package Studio

## Release scope

Batch 13 adds a publishable customer-driven module: Package Studio.

## Built module

- `src/modules/package-studio`
- Standalone one-folder extended module
- Depends only on Core
- Public APIs are compatible with LSevin front/mobile
- Admin moderation route is included
- Provider/staff package management route is included
- Notification dispatch uses Core ModuleBus

## Routes

- `/providers/:providerId/package-studio`
- `/admin/package-studio`
- `/providers/:providerId/packages`

## Public APIs

- `GET /api/public/providers/:providerId/packages`
- `POST /api/public/providers/:providerId/package-events`
- `POST /api/public/providers/:providerId/package-requests`
- `POST /api/public/providers/:providerId/custom-package-requests`

## Customer value

Customers can review clear package cards, inclusions, price ranges, optional support items and consultation requirements before submitting package/custom quote requests inside LSevin.

## Admin value

LSevin admins can moderate package claims and supervise package request demand before public promotion.

## Architecture notes

No sibling module imports were added. Package Studio requests notification delivery through Core ModuleBus capabilities.

## External gates

- Run `npm install`, `npm run typecheck`, `npm run build` in CI/staging.
- Run migrations on staging PostgreSQL.
- Connect LSevin front/mobile to the package bridge helper.
- Validate price/eligibility wording with operations before paid promotion.
