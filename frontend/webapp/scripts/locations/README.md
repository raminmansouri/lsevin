# Additive multilingual location importer

Imports inhabited cities, towns and villages for the 25 countries requested on
2026-10-18. GeoNames country dumps are used without a population cutoff or a row
cap. Abandoned, destroyed and historical settlements, city sections and groups of
places are excluded. GeoNames does not guarantee completeness or accuracy:
https://download.geonames.org/export/dump/readme.txt

Data attribution: GeoNames, https://www.geonames.org/, CC BY 4.0.
Keep this attribution with redistributed exports. Source SHA-256 checksums and
retrieval date are recorded in `manifest.json` and the generated report.

## Safety contract

- Existing location UUIDs, codes, parents, types, display orders and creation dates
  are preserved. No records are deleted, merged, renamed or reparented.
- Only absent/empty translations are filled. Nonempty admin translations win.
  Both base and regional locale keys are supported without replacing either.
- New rows have deterministic UUIDv5 identities and short GeoNames-derived codes.
  `0072_location_geonames_refs.sql` adds a separate source-ID mapping table with
  primary/unique/FK constraints; it does not alter existing location columns.
- Names are matched within a country and location type using Unicode/Arabic-Persian
  normalization and source aliases. Ambiguities, multiple sources claiming one
  legacy row, conflicting provinces and duplicate source name/coordinates are
  held for review. Different villages can legitimately share a name.
- Apply is atomic, uses the migration advisory lock and a location write lock,
  rejects a stale snapshot, verifies migration integrity, and asserts that all
  original identities and nonempty translations survived before committing.
- Do not replay an old generated SQL file after it has committed. Take a fresh
  snapshot and regenerate the plan. Persisted source IDs make that rerun additive
  and idempotent. A replayed old plan fails safely instead of replacing later edits.
- Catalogue imports cannot prove that differently named source records represent
  different real-world places. Review unresolved matches and source errors; no
  fuzzy matching or automatic destructive deduplication is performed.

## Operator workflow

Requirements: Python 3.11+ (standard library only), PostgreSQL `psql`, database
access capable of applying the migration. Run commands from `frontend/webapp`.
Keep downloaded datasets, backups and generated SQL outside the Git repository.
Use normal PostgreSQL credential handling (`.pgpass`/environment); do not put
passwords in command history or generated files.

```sh
python scripts/locations/import_geonames.py prepare --data-dir /secure/geonames
psql -X -qAt -f scripts/locations/snapshot.sql > /secure/location-snapshot.json
pg_dump --table=category.locations --table='category."LocationType"' > /secure/locations-before.sql
python scripts/locations/import_geonames.py plan \
  --data-dir /secure/geonames --snapshot /secure/location-snapshot.json \
  --out /secure/location-import.sql
```

Inspect `location-import.report.json`, `location-import.review.jsonl` and
`location-import.missing-fa.jsonl` before applying. Run against a restored
production-state database first. The report contains source counts, inserted and
matched counts, quarantined features and per-country language coverage.

```sh
python -m unittest discover -s scripts/locations -p 'test_*.py' -v
psql -X -v ON_ERROR_STOP=1 -f /secure/location-import.sql
```

For real PostgreSQL regression tests, set `GEONAMES_TEST_CONTAINER` to a local
PostgreSQL Docker container. The tests create and drop their own uniquely named
test databases; they never target the application database.

After a large initial import, use `psql -v country_codes=BH` when taking a snapshot
and `plan --countries BH` for maintenance by country. This limits workstation
memory usage while retaining the whole-database staleness guard. An unscoped
snapshot of millions of rows needs substantial PostgreSQL/workstation memory.

Live browser regressions (no payment or account changes):
`LOCATIONS_E2E_BASE_URL=https://your-app pnpm exec playwright test --config playwright.locations.config.ts`.
Set `LOCATIONS_E2E_DIRECT=1` to launch Chrome with its system proxy bypassed when
checking the Iran origin. Network routing still depends on the host environment.
`LOCATIONS_E2E_HOST_RULES` optionally supplies Chrome host resolver rules, for
example `MAP lsevin.ir 213.176.121.235` when checking that origin directly.

The SQL applies and registers only migration 0072 (same file/checksum used by the
normal migration runner). It does not apply unrelated historical migrations.

### Replicated installations

Lsevin's location table has SymmetricDS triggers. Choose one coordinated method:
apply on one writer and monitor replication to every node, **or** independently
verify and apply the same catalogue to both nodes with
`psql -v direct_both_nodes=1`. The latter disables SymmetricDS capture **only for
the current import transaction**, preventing millions of redundant change events.
It does not disable FK constraints, triggers globally or replication services.
Never use this flag for a single-node import that relies on replication.

The new source reference table is not automatically in the replication routing
configuration. Keep it on both nodes when using direct imports. If using normal
replication, configure and verify source-reference replication too.

After import: verify counts, UUID/parent preservation, FK constraints, migration
checksum, absence of source-ID duplicates, search response times, live location
picker behavior and the replication backlog. Refresh catalogue caches as needed.
Bulk countries need paginated search; legacy endpoints returning every city in
one response must not be used for a village-sized catalogue without adaptation.

## Translation coverage

The importer collects actual current GeoNames names for English, Persian, Arabic,
Turkish, German, Spanish, French, Kurdish, Russian, Tajik, Chinese, Azerbaijani,
Armenian, Georgian, Urdu, Pashto, Turkmen, Kazakh, Uzbek, Hindi, Greek and Bulgarian.
English falls back to the source's romanized name. Missing language names remain
missing; English is never stored as a fabricated Persian translation. Published
Persian coverage is particularly sparse for smaller Chinese/Indian villages.
Completing those names requires a separately reviewed translation dataset.

No generated data SQL belongs in an already-released migration. Do not run the
old `generate-locations-seed.mjs` to overwrite `0006_seed_world_locations.sql`.
