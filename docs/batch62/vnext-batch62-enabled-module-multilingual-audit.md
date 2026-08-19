# Batch 62 — Enabled-module multilingual audit

Release: `v1.0.0-rc.25`

## Scope and standard

The 24 release-approved modules were reviewed for two separate requirements:

1. **Interface localization** — headings, controls, validation, statuses, empty states and guidance must use complete copy for `fa`, `en`, `ar`, `tr`, `es`, `ku`, `de` and `fr`.
2. **Multilingual business data** — user-entered titles and descriptions must use Core localized fields and the active locale when displayed.

A module is not marked complete merely because it wraps English literals in the global `UiText` component. Complete status requires a module-owned dictionary or a fully verified complete-phrase catalog for every visible workflow.

## Batch 62 result

The public provider and staff landing experience in `provider-onboarding` is now complete in all eight locales. The language switcher is visible before authentication, RTL/LTR layout is derived from the active locale, and metadata is localized. The application forms and administration review pages remain a separate next pass.

## Enabled module register

| Module ID | Module | Interface localization status | Multilingual business-data status | Priority / next action |
|---|---|---|---|---|
| `booking-management` | Booking Management | Complete explicit eight-locale dictionary | Operational fields are IDs/status/notes; locale-aware labels complete | Maintain; live provider A/B UAT |
| `onboarding` | Provider Onboarding | **Public provider/staff landing complete in Batch 62; application and admin pages partial** | Provider display names use localized fields; remaining form guidance needs explicit copy | **P0 next: application, staff request and admin review** |
| `provider-portal` | Provider Portal Core | Partial; heavy global `UiText` reliance | Core section labels support translation maps | P1: shell/workspace and provider-section copy |
| `providers` | Provider Profile Management | Partial complete-phrase translation | Localized name, description, detail and address fields exist | P1: explicit page/form dictionary and save/reopen matrix |
| `services` | Service Management | Partial complete-phrase translation | Localized service name/description fields exist | P1: explicit form, validation, rich-text and status copy |
| `staff` | Staff Management | Partial complete-phrase translation | Localized name, title, biography and notes exist | P1: explicit profile/claim/service-assignment copy |
| `availability` | Availability | Partial complete-phrase translation | Schedule data is locale-neutral; dates/timezones are locale-aware | P1: rules, conflicts, resource and validation copy |
| `bookings` | Bookings | Partial complete-phrase translation | Booking data is locale-neutral; provider notes remain text | P1: explicit lifecycle/status/document copy |
| `media` | Media | Partial complete-phrase translation | Media title/description/alt support translation maps | P1: explicit picker, ownership, privacy and error copy |
| `provider-access` | Provider Access | Partial complete-phrase translation | Membership roles are locale-neutral | P1: invitations, roles, removal and security guidance |
| `payment-billing` | Payment & Billing | Partial; module metadata files are not a complete UI catalog | Invoice/payment fields are mostly locale-neutral | P1: gateway, invoice, receipt, callback and error dictionary |
| `provider-finance-analytics` | Provider Finance & Analytics | Partial; extensive global `UiText` use | Financial data is locale-neutral; descriptions/notes need policy | P1: wallet, settlement, withdrawal and reconciliation copy |
| `finance` | Provider Finance Legacy | Partial and overlapping | Financial data is locale-neutral | P1: deprecate or migrate before further translation work |
| `admin-governance` | Administration Governance | Partial; many global phrase lookups | Governance records are locale-neutral | P1: complete administrator/audit/security dictionary |
| `dashboard` | Provider Dashboard | Partial complete-phrase translation | KPI data is locale-neutral | P2: explicit KPI, empty/error and time-range copy |
| `offers` | Offers | Partial complete-phrase translation | Offer description supports translation; title model needs review | P2: lifecycle, limits, service selector and customer reflection copy |
| `reviews` | Reviews | Partial complete-phrase translation | Customer text stays original; workflow labels need localization | P2: moderation, reply, target and visibility dictionary |
| `support` | Support | Partial complete-phrase translation | Ticket subject/message remain original customer content | P2: status, priority, attachment, SLA and assignment copy |
| `reporting-analytics` | Reporting & Analytics | Partial; two metadata locale files only | Report metrics are locale-neutral | P2: filters, dates, exports, metric definitions and empty states |
| `pricing-plans` | Pricing Plans | Partial; two metadata locale files only | Plan display text needs translation-map review | P2: plan, entitlement, proration and billing copy |
| `manage` | Provider Manage Shell | Partial but small surface | No material multilingual business data | P2: navigation and role-specific guidance |
| `media-library` | Media Library | Partial and duplicate of Media | Translation maps exist for media metadata | P3: consolidate into canonical Media module first |
| `reviews-standalone` | Reviews Standalone | Partial and duplicate of Reviews | Review text is customer-authored | P3: consolidate into canonical Reviews module first |
| `ticketing` | Ticketing | Partial and duplicate of Support | Ticket content is user-authored | P3: consolidate into canonical Support module first |

## Recommended implementation sequence

1. Finish the remaining `onboarding` application and administration surfaces.
2. Complete the main provider editing chain: `provider-portal`, `providers`, `services`, `staff`, `availability`, `bookings`, `media`, `provider-access`.
3. Complete financial surfaces: `payment-billing` and `provider-finance-analytics`, while retiring or migrating legacy `finance`.
4. Complete operational modules: dashboard, offers, reviews, support, reporting and pricing.
5. Consolidate duplicate Media, Reviews and Ticketing modules before investing in separate translation catalogs.

## Honest completion state

- Enabled modules: **24**
- Modules with a complete explicit eight-locale operational dictionary: **1** (`booking-management`)
- Modules with a fully completed public entry surface: **1 additional surface** (`onboarding` public landing)
- Remaining modules/surfaces requiring explicit multilingual work: **23 modules plus the authenticated/admin onboarding pages**
