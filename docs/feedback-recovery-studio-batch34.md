# Batch 34 — Feedback & Service Recovery Studio

## Product outcome
Providers can receive private or anonymous customer feedback, triage dissatisfaction, assign an owner, commit to response and resolution deadlines, offer customer-visible recovery actions, receive customer acceptance or rejection, close or reopen the issue, and invite an optional public review only after resolution and explicit customer consent.

## Supported feedback
- CSAT, NPS, CES
- Post-service, post-booking, post-consultation, post-case and post-membership surveys
- Custom surveys with configurable score range and low-score threshold
- Private, contactable and provider-approved anonymous feedback
- Generic source references for bookings, cases, memberships, classes, proposals, payments and other LSevin journeys

## Recovery controls
- Automatic severity and priority triage from low scores and safety/privacy/staff-conduct categories
- Response and resolution SLA deadlines
- Provider owner, recovery summary and private note
- Customer-visible recovery actions: apology, callback, explanation, redo service, refund review, credit, replacement and custom actions
- Generic financial references without sibling-module imports
- Accept, decline, confirm resolved, reopen, request contact and add-details flows
- Customer-visible timeline with internal-note isolation

## Review integrity
Public review invitation requires:
1. Provider policy permits invitations.
2. Feedback case status is resolved or closed.
3. Customer explicitly granted public-review consent.
4. The case was not already invited.

The invitation code intentionally contains no score or sentiment condition. Positive-only review solicitation is not supported.

## Security
- 256-bit raw access token returned only on creation.
- PostgreSQL stores only SHA-256 access-token and identity hashes.
- Protected APIs accept `x-lsevin-feedback-token` only.
- Browser flow stores the raw token in an HttpOnly, SameSite=Lax cookie scoped to the feedback route.
- Raw token is excluded from URLs and protected request bodies.
- Customer DTO excludes phone, email, assigned staff, private notes and internal activities.

## Routes
- Provider: `/providers/:providerId/feedback-recovery`
- Admin: `/admin/feedback-recovery`
- Public: `/providers/:providerId/feedback`

## Readiness
`feedback_recovery_studio_ready` checks approved policy/surveys, critical unresolved cases, overdue response and resolution SLAs, and unsafe review invitations.
