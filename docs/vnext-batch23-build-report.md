# vNext Batch 23 Build Report — Document Intake Studio

## Summary

Batch 23 adds `document-intake-studio`, a standalone provider module for customer document checklists, customer submissions, review status, missing-document loops, admin supervision and LSevin front integration.

## Module

- Folder: `src/modules/document-intake-studio`
- Dependency: Core only
- Database schema: `document_intake_studio`
- Launch readiness key: `document_intake_studio_ready`

## Routes

- Provider: `/providers/:providerId/document-intake-studio`
- Admin: `/admin/document-intake-studio`
- Public: `/providers/:providerId/documents`

## Public API

- `GET /api/public/providers/:providerId/document-intake`
- `POST /api/public/providers/:providerId/document-intake-events`
- `POST /api/public/providers/:providerId/document-submissions`

## Customer/Product Outcome

Customers can understand required passports, IDs, labs, imaging, prescriptions, photos, consents and travel documents before consultation, booking, arrival or aftercare. Providers and LSevin admins can mark documents accepted, missing or rejected with reviewer notes.

## Integration

- Registered in Core module registry.
- Emits notification events through `notifications.emit_from_lsevin`.
- Adds notification seed migration `016_document_intake_studio_templates.sql`.
- Adds LSevin front bridge patch: `webapp-document-intake-studio-bridge-patch`.
- Adds launch readiness scoring in ProviderPortal repository.
