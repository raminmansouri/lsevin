# Batch 36 — Customer Progress & Outcomes Studio

## Product outcome

Give customers and providers one private, consent-aware workspace for goals, milestones, check-ins, measurements and review without promising a guaranteed medical, beauty, fitness or service outcome.

## Customer value

- Start or reopen a protected progress plan.
- See customer-visible goals, milestones, check-ins, measurements and provider updates.
- Update a visible goal, log a check-in, add a consented measurement and request provider review or help.
- Independently grant or withdraw measurement, media-reference and optional success-story consent.
- Escalate a safety concern for prompt provider review.

## Provider value

- Publish moderated templates for fitness, wellness, beauty, nutrition, rehabilitation, therapy, chronic care, coaching, dental and custom programs.
- Set goals, milestones, review dates, status, progress health and risk.
- Add provider check-ins, responses, measurements, public updates and private notes.
- Supervise stalled plans, overdue reviews and safety concerns.
- Prepare a generic story handoff only when the plan is completed, story consent is currently granted, risk is not high/critical and no safety concern exists.

## Admin value

- Moderate provider policies and templates.
- Supervise high-risk, critical, stalled and overdue-review plans.
- Detect story handoffs that conflict with completion, consent or risk rules.
- Keep private progress data separate from public community/story publication.

## Architecture

- Standalone folder: `src/modules/progress-outcomes-studio`
- Database schema: `progress_outcomes_studio`
- Depends only on Core.
- Optional booking, care, case, membership, class, media and community relationships remain generic entity references.
- Notifications use `notifications.emit_from_lsevin` through Core ModuleBus.

## Public routes and APIs

- Customer route: `/providers/:providerId/my-progress`
- Provider route: `/providers/:providerId/progress-outcomes`
- Admin route: `/admin/progress-outcomes`
- `GET /api/public/providers/:providerId/progress/profile`
- `POST /api/public/providers/:providerId/progress`
- `GET /api/public/providers/:providerId/progress/item`
- `POST /api/public/providers/:providerId/progress/responses`
- `POST /api/public/providers/:providerId/progress-events`

## Security and consent

- Access tokens and contact matching keys are stored only as SHA-256 hashes.
- Protected requests use `x-lsevin-progress-token`.
- Tokens are removed from protected JSON request bodies and never placed in URLs.
- Measurements require current measurement consent when configured.
- Media references require current media consent when configured.
- Internal notes are excluded from customer DTOs.
- Story handoff is not publication and requires a completed plan plus explicit current consent.
