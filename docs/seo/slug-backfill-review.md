# Public slug backfill review (1 November 2026)

This is a proposal for review, not a production backfill. The URL task list requires coordination before existing records receive slugs. The public route cutover, 301 redirects, and internal links remain pending.

## Production-derived staging clone

- Source: 1 November 2026 compressed PostgreSQL backup from the Lsevin server at `213.176.121.235`; SHA-256 `019aea20f92c8f5d4628816f2546b6fc472c74137e73502225391e32330854fb` matched after copying to F:.
- The source server runs PostgreSQL 17.10. The backup restored without error to an isolated PostgreSQL 18.6 cluster in WSL. This validates the data shape and migration SQL, but the version differs from the source and the application was not started against it.
- The clone had 164 recorded migrations, including all three `0084` migrations. Migration `0091_public_url_slugs.sql` was applied with `psql -v ON_ERROR_STOP=1`, outside the application migration runner. All five nullable columns and five partial unique indexes exist afterward.
- Existing rows remained at 186 providers, 12 provider types, 3,065 provider services, 304 staff, and 3 special packages; every new slug is null. A duplicate provider slug was rejected by the unique index in a transaction that did not persist.

## Proposed mapping

A full 3,570-row review CSV is at `F:\lsevin-staging-clone-20261101\public-slug-proposal.csv`. It is a local, access-restricted staging artifact and is not committed. The accompanying script is in the same directory. The proposal prefers the `en-US` public name and falls back to `fa-IR`, transliterates to lowercase ASCII, replaces separators with hyphens, prefixes each service with its provider slug, and adds a numeric suffix for duplicate values. The numeric suffix is assigned by stable record ID order. It never embeds a UUID in a URL.

| Entity | Rows | Numeric collision suffixes | Missing source names |
|---|---:|---:|---:|
| Provider | 186 | 2 | 0 |
| Specialty/provider type | 12 | 0 | 0 |
| Specialist/staff | 304 | 3 | 0 |
| Package | 3 | 0 | 0 |
| Provider service | 3,065 | 180 | 0 |

The raw English-only candidate check found four provider names and eight staff names without usable ASCII, and all three package titles were Persian-only. Service names repeat frequently: 1,324 duplicate English-only bases before provider prefixes, and 182 duplicate bases after adding provider names. The transliteration and suffix proposal resolves these mechanically, but editorial review is needed for public-facing spelling and duplicate service names. Service slugs can reach 136 characters; this also needs URL review.

## Remaining release work

1. Review/edit the CSV slug values and freeze the approved mapping. Confirm transliteration, suffixes, and long service slugs.
2. Add a new, immutable backfill migration using the approved mapping, plus checks for missing or duplicate slugs. Test it with the repository migration runner against a fresh clone of the previous production state.
3. Build and verify the selected slug routes, direct 301 legacy redirects, canonical tags, localized content, sitemap entries, and internal links. Keep the existing home route as decided.
4. Run the app, integration tests, persistent Playwright suite, and production-like smoke tests against the upgraded clone; verify deployment and live responses before release.

The branch is **not ready for release** until these steps pass.

## Approved mapping and staging result (2 November 2026)

The owner approved the proposed CSV without edits. The exact ID-to-slug mapping is now in immutable migration `0092_public_url_slug_backfill.sql`; no production backfill was run. On the isolated production-derived clone, `0085` followed by `0086` populated 186/186 providers, 12/12 types, 3,065/3,065 services, 304/304 staff, and 3/3 packages. Each entity's slug count equals its distinct-slug count. Re-running `0086` changed zero rows. A persistent mapping integrity test is in `tests/public-slug-migration.test.mjs`.

Google Search Central's [URL guidance](https://developers.google.com/search/docs/crawling-indexing/url-structure) recommends descriptive words, the audience's language or transliteration, lowercase normalization, and hyphens. Its [site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) calls for server-side permanent redirects, self-canonical new pages, updated internal links and sitemaps, and avoiding redirect chains. These are criteria for the subsequent route cutover. Search ranking position is not guaranteed by any URL format.

## Migration-runner verification (2 November 2026)

The production backup was restored again into a fresh isolated database. The repository runner initially rejected all historical checksums on Windows because Git's CRLF checkout differs from the LF bytes recorded by the Linux deployment. `migrationChecksum()` now normalizes CRLF to LF before hashing; a regression test checks the actual production checksum of `0084_translation_empty_fast_path.sql` and rejects changed SQL text. With that fix, the runner recognized the prior 164 migration records and applied only `0085` and `0086`. Both were recorded, all 3,570 target rows retained unique non-null slugs, and a subsequent dry run reported up to date. The runner reported nested-transaction notices for `0086`, which contains its own `BEGIN`/`COMMIT`; SQL application succeeded, but the migration history write is a separate step. This migration has not been applied to production.
