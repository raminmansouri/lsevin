# vNext Batch 25 — Lead Pipeline Studio

Lead Pipeline Studio creates one provider-owned, LSevin-native follow-up workflow for inquiries, consultations, proposals, packages, offers, slot openings, referrals, content CTAs and booking intent.

## Module

`src/modules/lead-pipeline-studio`

## Customer journey

1. Customer opens `/providers/:providerId/next-step` from any LSevin provider/service/content surface.
2. Customer selects consultation, pricing, booking, travel support, aftercare or another approved request type.
3. The request is captured privately with urgency, preferred channel and source context.
4. Provider/staff sees the request in a pipeline stage, assigns follow-up, records calls/messages/tasks and moves the lead toward consultation, proposal or booking.
5. LSevin admin supervises urgent and overdue requests without publishing customer data.

## Routes

- `/providers/:providerId/lead-pipeline-studio`
- `/admin/lead-pipeline-studio`
- `/providers/:providerId/next-step`

## Public APIs

- `GET /api/public/providers/:providerId/lead-pipeline`
- `POST /api/public/providers/:providerId/lead-events`
- `POST /api/public/providers/:providerId/lead-requests`

## Architecture

The module imports only Core. Source modules pass context using API payloads or stable Core ModuleBus capabilities; no sibling module imports are allowed.

## Launch readiness

`lead_pipeline_studio_ready` evaluates approved pipelines, active stages, overdue follow-ups, recent activities/events and won leads.
