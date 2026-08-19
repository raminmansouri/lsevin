# Batch 41 administration completion report

## Objective

Audit all registered features for administrative coverage, align administrator detection with LSevin identity roles, implement the blocking onboarding review/approval workflow and track remaining gaps.

## LSevin role model

LSevin receives roles through its OTP/NextAuth session and recognizes `admin` and `superadmin`. The portal receives the same LSevin user ID and resolves roles from the shared identity tables. Role names are normalized to uppercase before permission evaluation.

RC4 preserves full access for `ADMIN` and `SUPERADMIN`, while supporting scoped portal roles. `CONVERSION_ADMIN` was added explicitly to prevent fallback to full `ADMIN`.

## Audit result

| Classification | Count |
|---|---:|
| Direct admin routes | 47 |
| Covered by replacement module | 6 |
| Separate page not required | 1 |
| Explicit backlog | 5 |
| Unclassified | 0 |
| Total registered modules | 59 |

## Implemented surfaces

### `/admin`

- current-user role evidence;
- operational application/provider counts;
- permission-filtered administration navigation;
- complete module coverage table;
- explicit backlog cards.

### `/admin/applications`

- status and text filters;
- six operational counts;
- orphaned provider-type detection;
- application queue using `LEFT JOIN`;
- consistent pending count semantics.

### `/admin/applications/:applicationId`

- full applicant and submission review;
- mark in review;
- request changes;
- reject;
- approve by create or attach;
- automatic provider owner membership;
- review-event timeline.

## Data integrity

Application approval is transactional and locks the application row. Create mode validates provider type and required location data. Attach mode validates the selected provider and provider type. Owner membership is upserted and the application is linked to the provider before the review event is recorded.

## Audit automation

`scripts/admin-surface-audit.py` scans all module definitions and generates both machine-readable and human-readable reports. `npm run qa:admin` fails for stale output or unclassified gaps.

## Remaining backlog

- global provider catalog;
- global provider-service catalog;
- global staff catalog;
- global availability-rule administration;
- global offer moderation.

These are represented as ST202–ST206 in the Batch 41 tracker.
