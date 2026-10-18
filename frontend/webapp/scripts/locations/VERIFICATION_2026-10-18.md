# Location catalogue verification — 2026-10-18

## IMPLEMENTED

Added a standard-library Python importer, checksummed source downloads, read-only
snapshot utility, reviewable atomic SQL generation, stable GeoNames identity
mapping, coverage/review exports, PostgreSQL regression tests and live Playwright
tests. Scope: the requested 25 countries, including inhabited towns and villages,
without a population cutoff or country row cap.

Existing records are not deleted, merged, reparented or assigned new IDs/codes.
Nonempty translations take precedence over source data. Ambiguous matches are
quarantined; existing duplicates are preserved rather than destructively merged.

Sources: [GeoNames extracts and schema](https://download.geonames.org/export/dump/readme.txt),
CC BY 4.0; [GeoNames](https://www.geonames.org/). Sources do not guarantee exhaustive
real-world coverage. English uses published English names or source romanization;
other languages use published current alternate names, not invented translations.

## ROOT CAUSE

The previous generator used cities15000, excluded population below 50,000, capped
countries at 60 or 250 cities, and loaded four languages. Name-derived short codes
alone could not reliably identify source places on future imports.

## VERIFIED

- Both production location snapshots initially contained 38,694 rows and the same fingerprint.
- Location tables and type tables backed up from both servers before changes.
- New migration and the full import executed successfully on a restored production
  location catalogue in PostgreSQL 17.10, preserving real indexes and foreign keys.
  Production SymmetricDS functions/triggers were excluded from that isolated restore.
- Full restored-state import: 1,916,190 inserted (1,916,188 settlements and two provinces),
  4,108 matched; 4,092 existing rows enriched; 1,954,884 total rows afterward.
- Transaction assertions passed for every existing UUID, code, parent, type,
  creation date, display order and nonempty translation. Zero orphan parents.
- Regenerated Bahrain import against the upgraded catalogue: zero inserts,
  zero translation updates, 98 matched source identities.
- 23 Python/PostgreSQL tests passed: Unicode matching, ambiguous matches, source
  identity reuse, zero-population villages, historical exclusions, rollback,
  invalid FK, stale snapshots, migration checksum mismatch, replication session
  mode, scoped snapshots and both fingerprint versions.
- Local query timings after ANALYZE: China search 306 ms; initial China picker 653 ms.
- Production import and migration committed on both servers: 1,954,884 locations
  and 1,920,298 unique source references on each; zero orphan parents.
- All location identities, hierarchy and translations match the verified restored
  catalogue. Both production location digests match `ab6d5eba04e1a7aa5595d8e037cf8725`.
  Both source-reference digests match `eba6ce74fcb22faa38d0e32ec3014837`.
- Live Playwright: 2/2 passed on each of lsevincare.com, appmain.lsevin.com and
  lsevin.ir (six checks). New village selection, URL navigation, refresh persistence,
  legacy Tehran search and empty search were exercised. Iran browser verification
  used a loopback TLS tunnel bound to the physical interface to bypass V2Ray.
- Post-import health/home/shop/cart/sign-in/session smoke checks passed on all
  three domains; the unauthenticated checkout redirect remained correct.
  Checked application error categories were zero in recent deployed logs.
- PostgreSQL statistics refreshed on both servers. Replication batches had only
  OK statuses. Temporary server import payloads and the local browser tunnel were removed.

## NOT VERIFIED

Complete Persian/other-language coverage is not available in the source and is
not claimed. No exhaustive manual review of approximately two million source
features was possible. Full authenticated administration and legacy APIs returning
an entire country's cities were not exercised.

## DATABASE / MIGRATIONS

New additive migration: `0072_location_geonames_refs.sql`, creating a separate
source-ID reference table with primary, unique and FK constraints. Existing
location schema and released migrations are unchanged. Generated SQL verifies
and records that exact migration/checksum under the migration advisory lock.

Production location changes are replicated with SymmetricDS. Direct imports into
both nodes use a transaction-local capture setting, keeping normal replication
and foreign-key enforcement enabled outside that import session. Source references
must be maintained on both nodes because the new table is not automatically routed.

## REGRESSION TESTS

`scripts/locations/test_import_geonames.py`, `test_postgres_import.py`,
`e2e/locations-catalogue.spec.ts`, `playwright.locations.config.ts`.

## DEPLOYMENT REQUIRED

No frontend/backend application logic changed and no application restart, new
secret or environment variable is required. Import SQL applies its own single
additive migration. A full catalogue requires paginated location search; legacy
all-cities endpoints need separate scalability review before relying on them for
large-country village lists. Importer/migration/test files are local repository
changes; this task has not published an application build.

## RISKS

The source contains 2,009,783 settlements. 90,089 source features (including held
parent-dependent rows) are quarantined rather than guessed. Published Persian
names exist for 72,377 accepted settlements; many small settlements, particularly
in China/India, remain untranslated. Review/translation work is required to meet
the literal requirement that every settlement have Persian and every other language.
No algorithm can establish perfect geographic deduplication from names alone;
stable source identity and conservative matching prevent known repeat-import cases.

## RELEASE STATUS

**NOT READY FOR RELEASE**

The complete-language/completeness requirement remains unmet. This status is
separate from the operational outcome of importing the safe available data.

## Source coverage by country

| Country | Source settlements | Inserted locations | Matched | Held | Accepted settlements with Persian |
|---|---:|---:|---:|---:|---:|
| IR | 69,683 | 67,086 | 134 | 2,495 | 60,613 |
| TR | 52,648 | 50,423 | 246 | 2,061 | 548 |
| AZ | 5,019 | 4,940 | 115 | 36 | 1,964 |
| TJ | 2,642 | 2,599 | 24 | 25 | 74 |
| IQ | 20,820 | 20,699 | 65 | 76 | 371 |
| OM | 5,324 | 5,291 | 28 | 17 | 12 |
| QA | 179 | 168 | 16 | 4 | 8 |
| AE | 398 | 368 | 25 | 13 | 24 |
| AM | 1,222 | 1,193 | 26 | 15 | 109 |
| AF | 30,907 | 30,791 | 65 | 86 | 7,348 |
| PK | 145,696 | 144,090 | 130 | 1,484 | 244 |
| TM | 1,421 | 1,381 | 31 | 16 | 29 |
| GE | 5,333 | 5,306 | 24 | 16 | 68 |
| RU | 188,958 | 180,093 | 513 | 8,436 | 391 |
| KZ | 13,382 | 13,132 | 65 | 207 | 92 |
| UZ | 7,929 | 7,517 | 62 | 365 | 87 |
| CN | 875,727 | 830,704 | 315 | 44,740 | 24 |
| IN | 546,355 | 515,088 | 1,888 | 29,416 | 141 |
| KW | 68 | 55 | 14 | 6 | 3 |
| SA | 4,211 | 4,100 | 66 | 59 | 54 |
| JO | 1,255 | 1,222 | 37 | 9 | 13 |
| SY | 10,309 | 10,189 | 65 | 70 | 17 |
| GR | 14,227 | 13,779 | 82 | 381 | 27 |
| BG | 5,972 | 5,886 | 64 | 51 | 107 |
| BH | 98 | 90 | 8 | 5 | 9 |

## Operational status

Both production imports and post-import verification completed successfully.
Migration checksum on both servers:
`0654189ed9b8d00e9a56049b6a627e6f07634ecfe559d9de0aba0e06c4effc6d`.

The first attempt stopped before writes because a replication session setting
used invalid SQL syntax; it rolled back. The corrected mode has a real PostgreSQL
regression test. A later SSH observation session disconnected while its database
transaction continued; the committed catalogue was independently verified against
the restored model. The Iran run used a durable background runner with an audit log.
An initial Iran browser test assumed that the permission introduction was already
dismissed; the test now handles that valid UI state, and both tests passed afterward.
Initial direct Chrome requests followed the workstation's V2Ray route and received
504 responses; the physical-interface tunnel returned 200 and passed the workflows.

Operational logs, backups, source manifests, generated SQL, missing-Persian entries
and review entries are stored outside Git in `.codex-locations-20261018` in the
shared workspace. The new scripts/migration/tests remain local repository changes;
they were not pushed to the remote Git repository by this database task.
