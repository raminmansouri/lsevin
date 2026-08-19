# Batch 69 Multilingual Worklist Report

## Inventory after the second audit loop

| Classification | Count |
|---|---:|
| Enabled modules | 60 |
| Mapped routes | 164 |
| Audited page/support files | 352 |
| Rechecked | 39 |
| Needs conversion | 236 |
| Needs explicit phrase verification | 77 |

## Rechecked Staff group

- `src/modules/staff/components/StaffForm.tsx`
- `src/modules/staff/components/StaffManager.tsx`
- `src/modules/staff/pages/AdminStaffPage.tsx`
- `src/modules/staff/pages/EditStaffPage.tsx`
- `src/modules/staff/pages/SelfStaffProfilePage.tsx`
- `src/modules/staff/pages/StaffPage.tsx`
- `src/modules/staff/actions.ts`
- `src/modules/staff/module.tsx`

All target surfaces now follow the active portal locale for Persian, English, Arabic, Turkish, Spanish, Kurdish, German and French.

## Production-readiness additions

- Multilingual JSONB name, title, specialty and rich biography fields.
- Claim-scoped verified staff self-service.
- Ownership-aware media selection and server-side media validation.
- Independent provider-link and global staff activation.
- Idempotent administrator status changes and audit events.
- UUID, bounded-content, affected-row and destructive-reason validation.
- Pending submit controls and confirmation for unlink.
- Locale-aware repository reads, API responses, dates, numbers, statuses and errors.

## Next bounded queue

- `src/modules/availability/components/AvailabilityManager.tsx`
- `src/modules/availability/pages/AdminAvailabilityPage.tsx`
- `src/modules/availability/actions.ts`
- `src/modules/availability/module.tsx`
- Explicit runtime-copy recheck of `src/modules/availability/pages/AvailabilityPage.tsx`
