# Batch 22 — Partner Studio

Partner Studio adds a customer-facing partner network layer without direct sibling module dependencies.

## Scope

- Provider/staff partner profile
- Partner records for hotels, transfers, interpreters, travel agents, clinics, labs, pharmacies, gyms, spas, tours, insurance, financing and custom partners
- Partner offer cards with public visibility and LSevin moderation
- Customer partner-support requests
- Public partner page and public-safe DTO
- Admin moderation
- Notification hooks through Core ModuleBus
- Launch readiness key: `partner_studio_ready`

## Front compatibility

Public APIs:

- `GET /api/public/providers/:providerId/partners`
- `POST /api/public/providers/:providerId/partner-events`
- `POST /api/public/providers/:providerId/partner-requests`
