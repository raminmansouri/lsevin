# Dashboard module

Aggregates cross-provider metrics for the current user and provider workspaces.

The admin route `/admin` is the global administration control center. It documents LSevin role detection, provides operational counts and shows the complete admin-surface audit across all registered modules.


## Batch 60 — RC17 Market Preview 1

The provider dashboard now includes a market activation cockpit focused on time-to-first-booking. It derives a 0–100 readiness score only from existing LSevin-backed contracts: provider profile, active services, availability rules, provider gallery media, and active service offers. Booking and review data are shown as outcome signals, not manufactured growth metrics.

No new route, module, migration, table, public DTO, or sibling-module dependency is introduced. Staff is deliberately excluded from the readiness score so solo providers are not penalized.
