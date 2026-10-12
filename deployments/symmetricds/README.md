# Bidirectional PostgreSQL sync A <-> B with SymmetricDS (B never connects to A)

Status: **rehearsed on scratch copies on server A only. Not installed on the real databases.**

## Topology
- **B (Turkey)** runs the SymmetricDS *hub* (`group server`, node 000). It only answers requests.
- **A (Iran)** runs a *client* (`group client`, node 001). It **pushes** its changes to B and **pulls** B's
  changes on a timer, always initiating the connection (through the OpenVPN link). B never dials A.
- Every table with a primary key (696 tables) gets capture triggers on both sides; changes travel in
  batches over HTTP(S). Latency in rehearsal: 2-4 s when online; backlog drains after an outage.

## Use SymmetricDS 3.16.17, not 3.18.x
3.18.1 Community throttles the push/pull jobs to a **15 minute minimum period** ("runs more frequently
than the minimum allowed period of 900000ms"). 3.16.17 and 3.15.17 do not contain that limit.
PostgreSQL 17 works with 3.16.17 (JDBC 42.7.11). Needs Java 21 (3.18) / 17+ (3.16).
Download: SourceForge `symmetricds-3.16/symmetric-server-3.16.17.zip` (sha256 3b1f9dbe...f073); A cannot reach
SourceForge, so download elsewhere and copy it over.

## Rehearsal results (tests/ scripts, run on two scratch DBs on A, 2026-10-08)
| Test | Result |
|---|---|
| Insert A->B and B->A | PASS (2-4 s) |
| Update, delete both directions | PASS |
| App trigger (`last_modified_date`) must not re-fire on the receiving side | PASS with `db.init.sql=set session_replication_role = replica` |
| No echo loop while idle | PASS |
| Hub down, A keeps writing, hub returns | PASS (3/3 rows, 0 pending) |
| Same row edited on both sides while disconnected | converged to the later edit (with and without a rule) |
| **Auto-number id collision, default sequences** | **FAIL: one row silently lost, no error** |
| Auto-number collision with odd/even sequences (`sql/sequence-parity.sql`) | PASS: both rows kept |

## Must-do before production
1. Run `sql/sequence-parity.sql` on A (`parity=1`) and B (`parity=0`) BEFORE enabling sync. 26 columns use
   sequences, including accounting `invoice_number`, `entry_number`, `wallet_ledger.seq`. Numbers will have
   gaps; counters that must be gapless should be written on one node only.
2. Excluded from sync (each node keeps its own): `background_jobs` (job queue), `schema_migrations`,
   `lsevin_provider_portal_migrations`, `__EFMigrationsHistory`, `sessions`, `refresh_tokens`,
   `phone_login_codes`, `sso_sessions`, `panel_sessions`, `panel_login_attempts`, `rate_limit_hits`.
   Tables without a primary key are not synced: `category.Currency`, `public.analytics_visitor_sessions`,
   `search.trending_searches`.
3. Add explicit newest-wins rules (`sym_conflict`, `USE_TIMESTAMP` on `last_modified_date`/`updated_at`)
   for tables that have such a column. Money/booking tables need an owner decision.
4. Use a dedicated DB user for SymmetricDS, not the superuser used in the rehearsal.
5. Seed A from B with `deployments/sync/sync-b-to-a.sh`, then register A with initial load OFF
   (`auto.reload=false`; check `sym_node_security.initial_load_enabled=0`). Never let it initial-load over live data.
6. B-side changes are production changes: a `sym_*` schema in the live database, ~2,100 triggers, a Caddy
   route `/sync/*` -> hub, a Java process (~400 MB). Do it in a maintenance window with a fresh backup.

## Known limits
- Existing "immutable" triggers (`fn_block_*` on accounting tables) are bypassed during apply (replica role);
  they still protect local writes.
- Capture triggers add write overhead and `sym_data` grows; `sym_data` purge is automatic but monitor it.
- If the VPN is down for a long time both sides keep working and the backlog is replayed in order.
