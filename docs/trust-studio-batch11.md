# vNext Batch 11 — Trust Studio

## Product goal

Give providers and staff Instagram-like trust-building tools inside LSevin so customers can verify documents, badges, credentials, facility proof, safety/aftercare signals and anonymized customer stories without leaving the platform.

## Architecture

- New standalone module: `src/modules/trust-studio`
- Depends only on Core
- Uses Core ModuleBus for notifications
- Public-safe APIs are designed for LSevin front/mobile
- Launch readiness adds `trust_studio_ready`

## Customer journey

1. Customer opens provider/staff trust page.
2. Customer sees LSevin-reviewed trust summary, badges and approved documents.
3. Customer opens proof, reads stories, saves/shares or asks a trust question.
4. Provider/staff and LSevin receive the right notification.
5. Admin moderates assets/badges/stories before public exposure.

## Provider/staff journey

1. Provider opens Trust Studio.
2. Updates trust promise and verification summary.
3. Submits licenses, certificates, facility proof, aftercare and pricing transparency proof.
4. Adds safe customer stories.
5. Waits for admin approval/badges.

## Admin journey

1. LSevin admin reviews submitted trust assets.
2. Approves/publishes/rejects with notes.
3. Awards badges like verified license, transparent pricing, aftercare ready.
4. Monitors customer trust questions.

## Launch gate

A provider is trust-ready when it has at least two approved trust assets, one public badge and no open trust question backlog.
