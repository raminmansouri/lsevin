# vNext Batch 25 Build Report

## Release

- Batch: **25**
- Product release: **vNext 3.3 Launch**
- Epic: **EP32 — Unified Lead Pipeline & Follow-up Studio**
- Readiness capability: `lead_pipeline_studio_ready`

## Customer-driven functionality added

- Moderated provider response profile with request types, response SLA, preferred channels and safety notice.
- Configurable pipelines and ordered stages for new, qualified, consultation, proposal, booking, won and lost workflows.
- Private customer next-step request capture with source attribution, urgency, locale, channel consent and contact details.
- Provider/staff lead ownership, assignment, stage movement, estimated value, follow-up scheduling and outcome tracking.
- Activity timeline for notes, tasks, calls, messages, follow-ups, assignments, stage changes and booking intent.
- Admin moderation plus urgent and overdue follow-up supervision.
- Stable public APIs and a LSevin front/mobile bridge helper.
- Notification templates for new requests and follow-up events.
- Provider launch-readiness evidence and score integration.

## Routes and APIs

- Provider: `/providers/:providerId/lead-pipeline-studio`
- Admin: `/admin/lead-pipeline-studio`
- Public: `/providers/:providerId/next-step`
- `GET /api/public/providers/:providerId/lead-pipeline`
- `POST /api/public/providers/:providerId/lead-events`
- `POST /api/public/providers/:providerId/lead-requests`

## Architecture

Lead Pipeline Studio is a one-folder standalone extended module. It declares only a Core dependency, contains its migration and public/provider/admin surfaces, and does not import consultation, proposal, booking, notification or other sibling modules. Cross-module notification delivery uses the Core ModuleBus capability `notifications.emit_from_lsevin`.

## Validation status

- Batch 25 feature QA: passed 10/10 loops.
- Static modularity QA: passed 10/10 loops.
- Launch-readiness QA: passed 10/10 loops.
- Lead Pipeline Studio TypeScript diagnostics: zero.
- Full repository typecheck/build: blocked by 92 pre-existing diagnostics in older Core/modules; Next.js completed application compilation before failing repository-wide type validation.

See `docs/vnext-batch25-qa-loop-report.md` for evidence and external UAT gates.
