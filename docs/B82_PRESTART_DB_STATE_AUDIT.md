# B82 Pre-start PostgreSQL state audit

## Trigger

Runtime evidence showed PostgreSQL healthy enough to accept connections but repeatedly rejecting the configured `postgres` credential through `host ... scram-sha-256`.

## Root cause

The previous B80/B81 recovery path started PostgreSQL first and then attempted to rotate the password from a sidecar over a shared Unix socket. That assumes local socket authentication is usable without already knowing the old database password. Existing clusters can carry a `pg_hba.conf` that invalidates that assumption.

The official PostgreSQL Docker image also does not reapply `POSTGRES_PASSWORD` to an existing PGDATA directory; Docker-specific initialization variables affect empty data directories only.

## B82 architecture

Self-hosted Docker:

`dbstate -> postgres -> dbverify -> migrationaudit -> migrate -> permissions -> web`

- `dbstate` mounts PGDATA before the PostgreSQL server starts.
- Empty PGDATA: no-op, leaving normal image initialization intact.
- Existing PGDATA: validates PostgreSQL major version, requires the canonical `postgres` role, refuses concurrent/live PGDATA, then uses PostgreSQL single-user mode to update the stored role password with SCRAM-SHA-256.
- No PGDATA deletion, `initdb`, or volume reset is allowed.
- `dbverify` waits for healthy PostgreSQL and performs a bounded TCP authenticated `select 1` using the same credential contract used by migrations.
- Migration lineage audit and migration apply cannot start until `dbverify` succeeds.

Self-hosted Kubernetes/Rancher:

- The PostgreSQL StatefulSet now uses a `reconcile-admin-credential-prestart` initContainer mounting the database PVC.
- The old `postStart` password reconciler is removed.
- The official Alpine PostgreSQL image's standard postgres UID/GID 70 is used for the maintenance initContainer.
- App-side authenticated database wait is bounded rather than infinite.

Managed/external PostgreSQL:

- No credential mutation is attempted.
- A valid externally managed admin credential remains required.

## Safety invariants

- no `docker compose down -v`
- no PGDATA deletion
- no database reinitialization
- no password in command-line arguments
- fail if PostgreSQL major version differs
- fail if `postmaster.pid` exists during pre-start maintenance
- fail if newline-bearing admin password would make single-user SQL ambiguous
- web still uses the limited `providers_portal_app` runtime role
- admin password remains outside the web runtime

## Release-level prevention

`validate-deployment-contract.mjs` and `validate-static.py` now reject:

- the old `dbcredential` service
- shared `postgres_*_socket` credential-repair volumes
- old `reconcile-admin-password.sh`
- Kubernetes `postStart` credential rotation
- missing `dbstate` -> `postgres` ordering
- missing post-start TCP `dbverify`
- dangerous PGDATA delete/reinitialize logic in the pre-start script

## Runtime evidence boundary

Static/fresh-snapshot validation is complete. The actual single-user password rewrite can only be proven against the user's existing Docker PGDATA volume during the next local run.
