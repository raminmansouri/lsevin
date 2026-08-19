# LSevin Providers Portal vNext — Batch 27 Build Report

## Release

- Release: **vNext Batch 27 / vNext 3.5 Launch**
- New module: **Customer Case Studio**
- Architecture: one-folder standalone extended module; Core-only dependency
- Provider route: `/providers/:providerId/customer-cases`
- Customer route: `/providers/:providerId/my-case`
- Admin route: `/admin/customer-cases`
- Readiness key: `customer_case_studio_ready`

## Main customer loop

Approved case profile → secure customer case request → coordinator ownership → milestones/tasks/timeline/blockers → consultation/proposal/booking/travel/treatment/aftercare handoffs → completion or supervised escalation.

## Changed integration surfaces

- `src/core/modules/registry.ts`
- `src/modules/provider-portal/repository.ts`
- `src/modules/notifications-module/module.tsx`
- `src/modules/notifications-module/migrations/020_customer_case_studio_templates.sql`
- `webapp-customer-case-studio-bridge-patch`

## Validation

- Feature QA: 10/10 passed
- Static QA: 10/10 passed
- Launch-readiness QA: 10/10 passed
- Module/bridge TypeScript diagnostics: 0
- Full repository typecheck: 92 pre-existing diagnostics
- Next.js webpack build: application compiled, then stopped on the existing Core navigation typing baseline

## Release packaging

The release set contains the complete project, standalone module archive, changed-code archive, LSevin web/mobile bridge patch, tracker, QA/build reports, continuation prompt and SHA-256 manifests.
