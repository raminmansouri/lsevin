# Customer Case Studio — Batch 27

Customer Case Studio is a standalone, Core-only LSevin Providers Portal module for coordinating high-touch customer journeys from first request through consultation, proposal, documents, consent, payment, booking, travel, treatment, aftercare, wellness or fitness follow-up.

## Customer experience

- Open an approved provider case profile.
- Start a coordinated case request when self-start is enabled.
- Continue through a token-protected private workspace.
- See customer-visible milestones, tasks, blockers, progress, readiness and next actions.
- Complete customer-owned tasks and send check-ins without leaving LSevin.
- Raise a blocking concern for provider/admin supervision.

## Provider and staff experience

- Configure moderated public case settings and reusable journey templates.
- Create and own customer cases from any LSevin source through stable external references.
- Manage coordinator assignment, status, phase, priority, risk and dates.
- Create milestones, tasks, timeline updates and blockers.
- Keep internal notes private while publishing safe customer-visible updates.
- Track overdue work, completion, readiness and escalations.

## Admin experience

- Moderate public profiles and templates.
- Supervise urgent, high-risk, escalated and overdue cases.
- Review unresolved high-severity blockers.
- Use `customer_case_studio_ready` as launch-readiness evidence.

## Security boundary

- Raw customer case tokens are never stored; only SHA-256 hashes are persisted.
- Protected API operations accept the token only in `x-lsevin-case-token`.
- Browser access moves the token into an HttpOnly, same-site cookie.
- Tokens are excluded from URLs, analytics payloads and protected request bodies.
- Public DTOs include only customer-visible, non-internal updates and blockers.
- The module imports Core only and communicates with other capabilities through the Core ModuleBus.
