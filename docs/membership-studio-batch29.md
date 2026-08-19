# Batch 29 — Membership & Pass Studio

## Customer outcome
Customers can compare approved memberships, class/session packs, treatment courses and wellness passes with visible price, duration, included credits, renewal and cancellation terms. They can securely accept, request payment, pause, resume, cancel, renew, decline or ask for help.

## Provider outcome
Providers can build recurring-revenue plans, maintain a member roster, track validity and credit usage, issue optional invoices through Core ModuleBus and supervise renewals without importing PaymentBilling or other modules.

## Safety and consumer-rights boundary
- Auto-renewal requires explicit recorded consent.
- Customer-visible usage excludes internal notes.
- Credit redemption cannot exceed the available balance.
- Cancellation and pause controls are provider-configurable and publicly disclosed.
- Access tokens are hash-only at rest and header-only for protected APIs.
- Price, currency, validity and terms are snapshotted on each membership.

## External gates
Wire the bridge into LSevin provider, service, package, proposal, booking, case and rebooking surfaces. Run staging UAT with real gym, clinic, salon, spa, trainer and recurring-care policies plus Iranian billing and consumer-rights review.
