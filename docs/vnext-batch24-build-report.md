# vNext Batch 24 Build Report

## Added

- Consent Studio standalone module
- Consent profile, forms, clauses, consent records and event tracking
- Public consent page and public APIs
- Admin review/moderation queue
- Notification template migration
- Launch readiness item `consent_studio_ready`
- LSevin front bridge helper

## Architecture

The module depends only on Core. It uses `notifications.emit_from_lsevin` via Core ModuleBus and does not import sibling modules.
