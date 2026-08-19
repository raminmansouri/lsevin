# Batch 63 — Persistent Multilingual Worklist and Application Submission

Release: `v1.0.0-rc.26`

## Purpose

Batch 63 turns the multilingual conversion program into a persistent, source-derived queue. It does not claim that all enabled modules are translated. Every enabled-module route page and supporting UI/action/error file is classified so subsequent batches can resume from the first open item and rerun the same audit after each conversion slice.

## Inventory

- Enabled modules audited: 24
- Route pages: 65
- Page/support files: 135
- Rechecked: 67
- Needs work: 63
- Needs explicit phrase verification: 5
- Hard-coded literal occurrences recorded: 568
- Shared `UiText` occurrences recorded: 600

Authoritative artifacts:

- `docs/batch63/active-module-multilingual-worklist.csv`
- `docs/batch63/active-module-multilingual-worklist.json`
- `docs/batch63/active-module-multilingual-worklist.md`
- Tracker sheet: `Multilingual_Worklist`

## Completed slice

The following Onboarding files were converted and rechecked:

1. `src/modules/onboarding/pages/ApplicationsPage.tsx`
2. `src/modules/onboarding/pages/NewApplicationPage.tsx`
3. `src/modules/onboarding/pages/NewStaffApplicationPage.tsx`
4. `src/modules/onboarding/components/ApplicationForm.tsx`
5. `src/modules/onboarding/actions.ts`

A typed eight-locale dictionary was added at:

- `src/modules/onboarding/i18n/applicationCopy.ts`

The completed slice includes:

- provider application list headings, statuses and actions;
- provider application form guidance and labels;
- staff application form guidance and labels;
- shared multilingual application fields;
- searchable country/city selection labels;
- locale-aware server validation errors;
- Persian default and correct RTL for Persian, Arabic and Kurdish;
- English, Turkish, Spanish, German and French LTR behavior.

No database, API, JSONB or route contract changed.

## Second-pass result

The source scanner was rerun after conversion. All five target files are `Rechecked`. Production runtime verification rendered these routes in all eight locales:

- `/applications`
- `/applications/new`
- `/applications/new/staff`

All 24 route-locale combinations returned HTTP 200 with the expected `lang`, `dir`, localized headings and multilingual field controls. There was no hydration mismatch and no `AggregateError`.

## Next exact queue position

The next continuation starts with:

1. `src/modules/onboarding/pages/AdminApplicationsPage.tsx`
2. `src/modules/onboarding/pages/AdminApplicationPage.tsx`
3. `src/modules/onboarding/approval-errors.ts`

After those three files are converted and rechecked, rerun the inventory and proceed to the next P0 enabled-module surface according to the tracker.
