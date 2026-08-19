# Batch 28 — Retention & Rebooking Studio

## Customer outcome
Completed customers receive a clear, consent-aware path back to the right provider for follow-up, maintenance, repeat service, renewal, check-up or missed-visit recovery without being subjected to aggressive outreach.

## Provider outcome
Providers configure moderated recurrence programs, see due/overdue/high-priority follow-up work, record auditable outreach, capture booking intent, and stop outreach automatically after decline, opt-out, cooldown or configured attempt limits.

## Architecture
- Standalone one-folder module: `src/modules/rebooking-studio`
- Depends only on Core contracts and ModuleBus
- Generic source and booking references; no sibling imports
- Notification templates remain in the standalone Notifications module
- Provider launch readiness is published as `rebooking_studio_ready`

## Privacy and safety
- Access tokens are random, SHA-256 hashed at rest and header-only in protected APIs
- Customer-visible activity is separated from internal notes
- Consent, decline, snooze and opt-out are first-class states
- Outreach attempt limits and cooldowns are enforced server-side
- No medical, treatment, travel, financial or service outcome is guaranteed
