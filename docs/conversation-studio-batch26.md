# Conversation Studio — Batch 26

## Problem

Batch 25 created a unified lead pipeline, but the actual conversation still had to happen through phone, WhatsApp, email or scattered module-specific forms. That breaks attribution, response-SLA measurement, customer privacy controls and the provider team's ability to coordinate.

## Customer journey

1. Customer opens `/providers/:providerId/messages` from a provider, consultation, proposal, package, offer, booking, care, concierge, document or consent surface.
2. Customer sees approved response expectations, office hours, topics, attachment policy and emergency notice.
3. Customer starts a private conversation.
4. The API returns a conversation id and a high-entropy access token; only its SHA-256 hash is stored.
5. Customer continues the thread through secure app storage or an HttpOnly portal cookie.
6. Provider/staff receives notification, owns the thread, sends replies or internal notes, assigns staff and updates waiting states.
7. Customer can report privacy, abuse, safety, misinformation or emergency misuse.
8. LSevin admin supervises urgent, escalated, overdue and reported conversations.

## Provider capabilities

- Public messaging profile and response SLA.
- Topic/language/attachment settings.
- Saved replies with moderation.
- Unified inbox with source attribution.
- Unread counters, assignment, priority and status.
- Customer-visible replies versus private internal notes.
- Attachment references.
- First-response measurement.
- Resolution, closure and escalation.

## Architecture

The module is self-contained in `src/modules/conversation-studio`. It imports Core only. Optional notifications use `notifications.emit_from_lsevin` through the Core ModuleBus. It never imports Lead Pipeline, Consultation, Proposal, Booking, Ticketing or Notifications directly.

## Public bridge

`webapp-conversation-studio-bridge-patch/src/lib/providerPortalConversationStudioBridge.ts` provides:

- `fetchProviderConversationProfile`
- `startProviderConversation`
- `fetchProviderConversationThread`
- `sendProviderConversationMessage`
- `reportProviderConversation`
- `sendProviderConversationEvent`

The LSevin front/mobile application must keep access tokens out of URLs, request bodies, logs and analytics payloads, store them in secure authenticated storage, and send them only through the `x-lsevin-conversation-token` request header.

## Readiness

Capability: `conversation_studio_ready`

Evidence includes approved profile/replies, open/waiting conversations, urgent/escalated workload, overdue responses, unread messages, open reports and 30-day message activity.
