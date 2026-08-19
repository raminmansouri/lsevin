# Batch 58 — Understandable Module Description Report

## Reported problem

All module cards used the same Persian paragraph. The paragraph described the module architecture but did not explain the actual business function, so a reader still could not tell what an unfamiliar module such as Challenge Studio was for.

## Resolution

### Curated semantic catalog

A new Core catalog, `src/core/modules/moduleDescriptions.ts`, contains a specific Persian and English description for every one of the 60 registered modules. The descriptions were written from the module README, registered pages and declared capabilities.

Each description answers:

1. What work does the module perform?
2. Who normally uses it?
3. What can the user create, monitor or complete?
4. Where useful, what is a concrete example?

### Example: Challenge Studio

The generic architecture sentence was replaced with an explanation that the module runs structured programs such as a 30-day fitness plan, skin-care routine, rehabilitation program or aftercare challenge. It explains that providers define milestones, customers join and send progress check-ins, and administrators moderate public content.

### Other examples

- Lead Pipeline Studio explains capturing potential customers, sales stages, calls, notes and next follow-up.
- Provider Finance & Analytics explains wallet balance, movement of money between LSevin/provider/customer, settlements and financial reports.
- Customer Case Studio explains the single operational case from inquiry through documents, payment, booking, treatment, travel and aftercare.

### Localization behavior

- Persian uses the curated Persian description.
- English uses the curated English description.
- Other configured locales currently use the complete English module-specific description until professional translations are approved.
- The system does not generate a repeated generic description or translate individual words inside an unknown sentence.

## Regression prevention

`scripts/vnext-batch58-module-description-qa.py` verifies:

- exact coverage of all 60 registry IDs;
- unique Persian descriptions;
- removal of the old generic sentence;
- practical minimum content length;
- concrete Challenge Studio wording;
- Core catalog integration;
- rc.21 release registration.

The production module-state smoke test additionally verifies actual rendered Persian descriptions for Challenge Studio, Lead Pipeline Studio and Provider Finance & Analytics.

## Architecture and compatibility

- The curated catalog is shared Core code.
- The administration page remains in the Admin Governance module.
- No sibling-module imports were introduced.
- No migration, route, DTO, API, permission or state-table change was required.
