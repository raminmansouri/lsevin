# vNext Batch 16 build report

- New standalone module: `src/modules/slotdrop-studio`.
- Provider route: `/providers/:providerId/slotdrop-studio`.
- Admin route: `/admin/slotdrop-studio`.
- Public route: `/providers/:providerId/slot-drops`.
- Public API: `GET /api/public/providers/:providerId/slot-drops`.
- Public API: `POST /api/public/providers/:providerId/slot-drop-events`.
- Public API: `POST /api/public/providers/:providerId/slot-drop-watch`.
- Public API: `POST /api/public/providers/:providerId/slot-drop-requests`.
- LSevin webapp bridge helper: `webapp-slotdrop-studio-bridge-patch/src/lib/providerPortalSlotDropBridge.ts`.
- Provider launch-readiness integration key: `slotdrop_studio_ready`.
- Notification delivery goes through Core ModuleBus capability `notifications.emit_from_lsevin`.
- No infrastructure-only features were added.
