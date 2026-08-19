# vNext Batch 26 Build Report

## Release

- Batch: **26**
- Product release: **vNext 3.4 Launch**
- Epic: **EP33 — Private Conversations & Provider Inbox**
- Module: `ConversationStudio`
- Readiness capability: `conversation_studio_ready`

## Customer-driven functionality added

- Moderated public provider messaging profile with topics, languages, office hours, response SLA, safety notice, attachment policy and new-conversation control.
- Moderated saved replies for consistent provider/staff responses.
- Private customer conversation creation using a high-entropy access token while persisting only its SHA-256 hash.
- Browser-safe continuation flow that moves the token to an HttpOnly cookie and redirects without the raw token in the URL. Protected API clients use the `x-lsevin-conversation-token` header and omit the token from query strings and request bodies.
- Provider/staff inbox with assignment, priority, unread counters, waiting states, resolution, closure and escalation.
- Public provider replies and customer-hidden internal notes.
- Private attachment references and source attribution without exposing message content through public provider DTOs.
- Customer reports for spam, abuse, privacy, safety, medical emergency, misinformation and other concerns.
- Automatic escalation and admin supervision for urgent, overdue and reported conversations.
- Conversation events and notification templates routed through the Core ModuleBus.
- Stable LSevin web/mobile bridge functions for profile, start, thread, message, report and event operations.
- Provider launch-readiness evidence and score integration.

## Routes and APIs

- Provider: `/providers/:providerId/conversation-studio`
- Admin: `/admin/conversation-studio`
- Public: `/providers/:providerId/messages`
- `GET /api/public/providers/:providerId/conversations/profile`
- `POST /api/public/providers/:providerId/conversations`
- `GET /api/public/providers/:providerId/conversations/thread`
- `POST /api/public/providers/:providerId/conversations/messages`
- `POST /api/public/providers/:providerId/conversations/reports`
- `POST /api/public/providers/:providerId/conversation-events`

## Architecture and privacy boundary

Conversation Studio is a one-folder standalone extended module. It declares only a Core dependency and contains its manifest, migration, contracts, repository, actions, APIs, provider/admin/public pages and test evidence. It does not import Lead Pipeline, Consultation, Proposal, Booking, Notification or another sibling module.

Optional notification delivery is invoked through Core ModuleBus capability `notifications.emit_from_lsevin`. A notification adapter failure is isolated from the persisted conversation operation.

The raw conversation access token is returned only when a conversation is created. The database stores only `access_token_hash`; customer-facing reads require token verification through the `x-lsevin-conversation-token` header or the server-side HttpOnly-cookie flow. Internal notes are marked non-customer-visible and filtered from the public thread DTO.

## Validation status

- Batch 26 feature QA: **10/10 passed**.
- Static modularity QA: **10/10 passed**.
- Launch-readiness QA: **10/10 passed**.
- Static QA coverage: **48 modules / 451 files**.
- Launch-readiness coverage: **48 modules / 706 files**.
- Conversation Studio TypeScript diagnostics: **0**.
- Full repository typecheck: **92 pre-existing diagnostics**, unchanged from Batch 25.
- Next.js webpack build: application compilation passed, then repository-wide type validation stopped on the pre-existing `ModuleNavigationItem` / `PortalShell.tsx` contract mismatch.

See `docs/vnext-batch26-qa-loop-report.md` for evidence and remaining external launch gates.
