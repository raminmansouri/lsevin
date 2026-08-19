# B78 deployment-contract audit

## Trigger

B77 strengthened `sourcecheck` from two checks to four checks, but the inherited
B75 deployment validator still searched for the old contiguous two-command text.
The result was a false failure before dependencies/migrations/web.

## Root cause

The deployment contract was expressed as brittle string equality rather than
structural invariants. B77 changed the implementation correctly but did not
update the validator that described it.

## Additional audit finding closed in B78

Production intentionally excludes `database-backup.sql` using `.dockerignore`,
but the old `--production-preinstall` validator unconditionally required the SQL
file inside the image build context. That was contradictory and would have been
the next production failure.

B78 makes the rule mode-aware:
- Local repository: SQL backup must exist and be non-empty.
- Production image: SQL backup must be absent from image context, and production
  Compose must mount it externally into PostgreSQL initdb.

## Required local sourcecheck order

1. `validate-source-tree.mjs`
2. `validate-release-contract.mjs`
3. `scripts/migrate.mjs --verify`
4. `run-quality-gates.mjs`

Then:
`sourcecheck -> migrate -> permissions -> web`.

## Required production image gates

After frozen pnpm dependency install and before Next build:
1. relative-import integrity
2. 24-module / 16-migration release contract
3. migration-plan verification
4. TypeScript/lint when `RUN_QA=true`
5. Next.js production build
