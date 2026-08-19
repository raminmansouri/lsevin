# Administration Governance

Standalone Core-only module for privileged LSevin administration governance.

## Routes

- `/admin/governance` — SUPERADMIN overview and safety evidence.
- `/admin/governance/users` — search LSevin users and effective roles.
- `/admin/governance/users/:userId` — assign or revoke allowlisted administration roles.
- `/admin/audit` — ADMIN/SUPERADMIN read-only unified administration timeline.

## Safety

- Only `SUPERADMIN` can change roles.
- A reason of at least five characters is mandatory.
- A superadmin cannot remove their own `SUPERADMIN` role.
- The last active `SUPERADMIN` cannot be removed.
- Role changes are written to `provider_portal.admin_governance_events`.
- Business audit sources remain owned by Core/Onboarding; this module reads them through SQL only and imports no sibling module.
