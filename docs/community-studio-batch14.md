# Batch 14 — Community Studio

## Release goal

Add LSevin-native community/social-proof tools so providers and staff can grow inside LSevin with moderated customer stories, safe galleries, prompts and responses.

## Customer-facing value

- Customers can read approved stories and social proof without leaving LSevin.
- Customers can submit their own story with public-consent flag.
- Customers can respond to approved discussion prompts.
- LSevin captures save/share/CTA/story-open events for growth analytics.

## Provider/staff value

- Provider/staff can configure a public community profile.
- Provider/staff can create story collections and discussion prompts.
- Provider/staff can seed verified stories where appropriate.
- Provider/staff can see submissions, open responses and 30-day community activity.

## Admin value

- LSevin admin can moderate customer stories and prompts.
- Admin can prevent unsafe claims and unmanaged social proof.
- Provider launch-readiness includes `community_studio_ready`.

## Architecture

- Standalone module: `src/modules/community-studio`.
- Depends only on Core.
- Notification delivery uses Core ModuleBus capability `notifications.emit_from_lsevin`.
- Public bridge patch is isolated in `webapp-community-studio-bridge-patch`.
