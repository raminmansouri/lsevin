# LSevin Providers Portal vNext — Batch 31 Build Report

## Release
- Batch: 31
- Launch label: vNext 3.9
- Module: Household & Caregiver Studio
- Readiness key: `household_caregiver_studio_ready`

## Product scope
Batch 31 adds provider/customer/admin workflows for household members, dependents, minors, guardians, companions and delegated caregivers. Owners can create a secure household, add members, invite caregivers, assign narrow permission scopes, submit verification references, revoke access and close the household. Providers supervise household status and customer-safe updates; admins moderate public configuration and review guardianship or high-privilege delegation risk.

## Public routes and APIs
- Provider: `/providers/:providerId/household-caregiver-studio`
- Admin: `/admin/household-caregiver-studio`
- Customer: `/providers/:providerId/household-care`
- Public APIs: profile, household start/get, member add, caregiver invite/accept, response and events.

## Security
- Owner, caregiver and invitation secrets are stored only as SHA-256 hashes.
- Protected APIs use `x-lsevin-household-token`.
- Invitation acceptance uses `x-lsevin-caregiver-code`.
- Secrets are not accepted from query strings by the public API bridge.
- Only the owner can invite caregivers, change permissions, revoke access or close the household.
- Revocation clears the delegate token immediately.
- Customer timelines require `customer_visible=true` and `is_internal_note=false`.
- High-privilege caregiver scopes and minor guardianship are supervised verification risks.

## Validation
- Feature/security QA: 10/10 passed.
- Static modularity QA: 10/10 passed.
- Launch-readiness QA: 10/10 passed.
- Registered modules: 53.
- TypeScript files checked: 496.
- Readiness files checked: 781.
- Household module TypeScript diagnostics: 0.
- Repository diagnostics: unchanged 92 pre-existing diagnostics.
- Next.js webpack build compiled successfully, then stopped on the existing `ModuleNavigationItem.moduleId` contract in `src/core/ui/PortalShell.tsx`.

## External launch gate
Real provider, customer, legal, privacy, security and frontend staging UAT remains required before public rollout.
