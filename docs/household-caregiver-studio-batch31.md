# Batch 31 — Household & Caregiver Studio

## Customer problem
LSevin journeys can involve children, elderly parents, dependents, companions, interpreters and caregivers, but the customer previously had no secure way to coordinate those people, their access, or legal-authority checks inside the provider portal.

## Delivered
- Moderated provider household profile and public safety/privacy notices.
- Secure household workspace with SHA-256 owner token storage.
- Dependent/member profiles with relationship, birth date, minor status, emergency-contact flag and generic external journey references.
- Caregiver invitations with hashed one-time codes and hashed delegate access tokens.
- Scoped delegation for profile view, bookings, documents, consent, updates, payments, memberships, cases and emergency contact.
- Owner-only permission changes, revocation and household closure.
- Verification queue for minor guardianship and high-privilege caregivers.
- Customer-safe timeline that excludes provider internal notes.
- Provider workspace, admin supervision page, public customer page and stable LSevin web/mobile bridge.
- Notification templates through Core ModuleBus.
- Launch-readiness key `household_caregiver_studio_ready`.

## Architecture
- Standalone folder: `src/modules/household-caregiver-studio`
- Depends only on Core.
- Consent, document, booking, case, membership and notification modules remain optional and are referenced only through generic entity references or Core ModuleBus.
