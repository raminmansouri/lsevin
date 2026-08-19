# Batch 51 — Searchable Selection, Media Query and Multinational Hardening

Release: `v1.0.0-rc.14`

## 1. Portal-wide searchable dropdowns

A new Core `SearchableSelect` is now the visible selection implementation across the source tree. Existing `<option>` contracts are parsed into a filterable list, while a hidden native select preserves form submission and validation semantics.

Audit result:

- Searchable select usages: **265**
- Direct native select files outside Core: **0**
- Existing `name`, submitted value, required and disabled contracts: preserved

## 2. PostgreSQL media query repair

The media repository previously joined ownership rows, selected `DISTINCT`, and ordered by `m.create_date`. PostgreSQL rejected this because the ordered expression was not part of the distinct select list.

The repository now:

- queries `media.media_library` directly;
- checks provider/user ownership with correlated `EXISTS` predicates;
- retains public-media behavior and provider membership enforcement;
- keeps deterministic media ordering without `DISTINCT`;
- changes no API payload or database schema.

## 3. Localized field language switching

Core `LocalizedField` now:

- exposes all configured LSevin locales;
- synchronizes the active locale among localized fields in the same form;
- preserves independent values for every locale;
- updates RTL/LTR direction when the tab changes;
- remounts locale-sensitive input/textarea/rich-text editors safely;
- submits `__localizedLocale`, which existing actions resolve as the active form locale.

Single-locale locks introduced in the five Batch 50 modules were removed.

## 4. Multinational shared UI

The Core shared UI translation layer covers recurring:

- buttons and actions;
- statuses and workflow labels;
- field labels and placeholders;
- search/select captions;
- headings and repeated navigation copy.

Supported locales:

- Persian (`fa` / `fa-IR`)
- English (`en` / `en-US`)
- Arabic (`ar`)
- Turkish (`tr` / `tr-TR`)
- Spanish (`es`)
- Kurdish (`ku`)
- German (`de`)
- French (`fr`)

User-authored rich content, editable inputs, textareas, code/preformatted elements and contenteditable regions are excluded from automatic translation.

## 5. Compatibility

- No migration added; migration count remains 84.
- Existing JSONB translation maps and scalar values are preserved.
- Existing form names and option values are preserved.
- Media ownership validation remains server-side.
- Modules still depend only on Core and remain self-contained under `src/modules/<module>`.

## 6. Verification results

- Typecheck: passed
- ESLint: passed
- Static QA: 60 modules / 594 files
- Batch 51 audit: passed
- Core experience QA: 41 assertions passed
- Admin surface: 53 direct, 6 covered, 1 not required, 0 backlog
- Admin catalog/governance/onboarding QA: passed
- Migration verification: 84 migrations
- Dependency audit: 0 vulnerabilities
- Local and production preflight fixtures: passed
- Authenticated dashboard/application routes: passed
- Six admin catalog routes: passed
- Governance routes and denial matrix: passed
- Production compilation and 3/3 static page generation completed; built output starts and serves fixture routes successfully

The synthetic build command remained attached during final trace collection even after BUILD_ID/manifests were written. The produced output was independently verified with `next start`, so this is recorded as a fixture process-exit limitation rather than an application compilation/runtime failure.
