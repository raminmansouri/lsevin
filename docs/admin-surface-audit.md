# LSevin Providers Portal admin-surface audit

## Result

- Production modules checked: **24**
- Direct admin pages: **18**
- Covered by replacement modules: **5**
- Separate page not required: **1**
- Genuine admin-page backlog: **0**
- Unclassified gaps: **0**

## LSevin administrator detection

The LSevin web application receives `roles` from the OTP/identity response and stores them in the NextAuth JWT/session. Its middleware allows admin routes when the session contains lowercase `admin` or `superadmin`.

The Providers Portal receives a short-lived signed assertion from the authenticated appmain session, issues an HTTP-only portal session, then queries `identity.asp_net_user_roles` joined to `identity.asp_net_roles`. `ADMIN` and `SUPERADMIN` grant all pages; scoped roles grant only their assigned routes.

The supplied database contains the canonical roles `admin` (`ADMIN`) and `user` (`USER`), so existing LSevin admin assignments are recognized without creating a second portal-specific account.

## Genuine backlog


## Full coverage table

| Module | Coverage | Admin routes or replacement | Notes |
|---|---|---|---|
| admin-governance | direct | `/admin/governance` (SUPERADMIN)<br>`/admin/governance/users` (SUPERADMIN)<br>`/admin/governance/users/:userId` (SUPERADMIN)<br>`/admin/audit` (ADMIN) | 4 direct admin route(s). |
| availability | direct | `/admin/availability` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| booking-management | direct | `/admin/booking-management` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| bookings | covered | Booking Management admin | Provider booking visibility is provider-scoped; global operational administration is handled by Booking Management. |
| dashboard | direct | `/admin` (ADMIN_PORTAL) | 1 direct admin route(s). |
| finance | covered | Provider Finance & Analytics admin | The legacy provider finance view is retained for compatibility; global finance administration is handled by Provider Finance & Analytics. |
| manage | not_required | — | Provider management is a provider workspace aggregator; global administration belongs to the underlying modules. |
| media | covered | LSevin platform media moderation | Provider media uses the canonical LSevin media library; global moderation stays in appmain. |
| media-library | direct | `/admin/media-library` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| notifications-module | direct | `/admin/notifications` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| offers | direct | `/admin/offers` (CONTENT_ADMIN) | 1 direct admin route(s). |
| onboarding | direct | `/admin/applications` (PROVIDER_ADMIN)<br>`/admin/applications/:applicationId` (PROVIDER_ADMIN) | 2 direct admin route(s). |
| payment-billing | direct | `/admin/billing` (FINANCE_ADMIN) | 1 direct admin route(s). |
| provider-access | covered | provider onboarding and governance | Claims, membership and ownership administration are covered by onboarding and governance. |
| provider-finance-analytics | direct | `/admin/finance` (FINANCE_ADMIN)<br>`/admin/finance/settlements` (FINANCE_ADMIN)<br>`/admin/reports` (FINANCE_ADMIN) | 3 direct admin route(s). |
| provider-portal | direct | `/admin/provider-claims` (PROVIDER_ADMIN)<br>`/admin/moderation` (CONTENT_ADMIN) | 2 direct admin route(s). |
| providers | direct | `/admin/providers` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| reporting-analytics | direct | `/admin/analytics` (FINANCE_ADMIN) | 1 direct admin route(s). |
| reviews | direct | `/admin/reviews` (REVIEW_ADMIN) | 1 direct admin route(s). |
| reviews-standalone | direct | `/admin/reviews` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| services | direct | `/admin/services` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| staff | direct | `/admin/staff` (PROVIDER_ADMIN) | 1 direct admin route(s). |
| support | covered | Ticketing admin | Provider/staff support requests are administered through the canonical Ticketing module. |
| ticketing | direct | `/admin/tickets` (PROVIDER_ADMIN) | 1 direct admin route(s). |

## Production administration scope

Implemented now:

- `/admin/providers` global provider catalog and audited publication/accreditation/sponsorship controls.
- `/admin/services` global provider-service catalog and audited activation/featured controls.
- `/admin/staff` global staff/provider-link catalog with ownership-claim separation.
- `/admin/availability` global rules/resources/operating-hours controls.
- Shared `provider_portal.admin_catalog_actions` audit history.
- Existing `/admin/applications` onboarding lifecycle retained.

Disabled modules are intentionally absent from this audit and from runtime routing.
