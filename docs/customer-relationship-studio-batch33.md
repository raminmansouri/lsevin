# Batch 33 — Customer Relationship Studio

## Product outcome
Providers now have one customer relationship workspace across acquisition, conversation, case, booking, care, payment, review, rebooking, membership, class, gift, household, documents, consent, loyalty and support.

## Customer-facing journey
- Open a private relationship workspace.
- Review customer-visible history, relationship summary, metrics and commitments.
- Update preferred channel, locale and service preferences.
- Request correction, help or provider contact.
- Withdraw marketing permission.
- Complete customer-owned commitments.

## Provider/staff journey
- Create and own customer relationships.
- Track lifecycle stage, health, risk, consent, preferences, preferred staff and next action.
- Import generic source-aware timeline records through Core ModuleBus.
- Add shared or internal commitments.
- Import relationship metrics such as bookings, value, satisfaction and no-shows.
- Add hash-only identity aliases and review duplicate suggestions.
- Complete non-destructive merges while preserving history.

## Safety and privacy
- Raw access tokens and identity aliases are never stored.
- Protected APIs use `x-lsevin-relationship-token`.
- Sensitive/internal records are excluded from customer DTOs.
- Duplicate merges preserve the original record as a merged reference and invalidate its token.
- Customer corrections create reviewable timeline requests rather than silently rewriting provider records.

## Architecture
- Module: `src/modules/customer-relationship-studio`
- Schema: `customer_relationship_studio`
- Dependencies: Core only
- Optional integrations: generic source references and Core ModuleBus
- Readiness key: `customer_relationship_studio_ready`
