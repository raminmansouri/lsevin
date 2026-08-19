# QA report

Module: `provider-finance-analytics`

Date: 2026-07-06

## Static QA passes

A static verifier was run against the clean single-folder module package 10 times.

Result:

```text
Pass 1: OK
Pass 2: OK
Pass 3: OK
Pass 4: OK
Pass 5: OK
Pass 6: OK
Pass 7: OK
Pass 8: OK
Pass 9: OK
Pass 10: OK
```

## Checks performed

- The module exists as one self-contained folder.
- No `scripts/` folder exists.
- No `route-segments/` folder exists.
- `module.tsx` exports a module definition.
- Provider and admin pages are inside the module folder.
- Required migration exists inside the module folder.
- Module imports do not depend on sibling modules.
- Module code uses the shared `core` boundary.
- Repository exports key finance/report functions.
- Server actions enforce provider permissions and finance-admin permissions.

## Not executed in sandbox

A real CRM `next build` was not executed because the CRM dependencies and runtime aliases are not installed in this sandbox. Run your CRM's normal checks after extraction:

```text
npm run typecheck
npm run build
```
