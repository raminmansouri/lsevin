# B84 PostgreSQL lifecycle audit

## Runtime evidence that triggered B84

The B83 pre-start helper refused to proceed because `postmaster.pid` existed. The
same Docker run also reported orphan containers from earlier release topologies.

## Root cause

A separate `dbstate` helper container cannot safely infer whether another Compose
generation still owns the same PGDATA volume. A bare `postmaster.pid` check also
cannot distinguish an active server from a stale lock file left by an interrupted
container lifecycle.

## B84 architecture

Docker self-hosted PostgreSQL no longer has a separate `dbstate` service.
`postgres-entrypoint-wrapper.sh` runs inside the PostgreSQL service container before
the official image entrypoint starts the server. Docker service replacement provides
exclusive lifecycle ownership of PGDATA.

For existing PGDATA, the wrapper asserts `PGDATA_EXCLUSIVE_MAINTENANCE=1`, then the
canonical reconciliation script:

1. checks PostgreSQL major version 17;
2. records cluster state with `pg_controldata` when a stale `postmaster.pid` exists;
3. removes only that stale lock file under explicit exclusive ownership;
4. rotates the admin credential in single-user mode;
5. leaves PGDATA intact;
6. delegates to `/usr/local/bin/docker-entrypoint.sh postgres`;
7. requires `dbverify` TCP/SCRAM success before migration audit.

Fresh PGDATA bypasses the reconciliation and uses normal official-image initialization.

Kubernetes/Rancher retains the initContainer model because initContainer ordering is
already exclusive with the PostgreSQL main container. It uses the same canonical
reconciler and explicitly asserts exclusive maintenance ownership.

## Orphan cleanup

The B84 apply script runs `docker compose down --remove-orphans` when Docker is
available. It never passes `-v` or `--volumes`, so named PostgreSQL/private/media
volumes remain intact.

## Fail-closed invariants

The release validators reject:

- any reintroduced `dbstate`/`dbcredential` separate credential service;
- a PostgreSQL service missing the in-service entrypoint wrapper;
- Docker/Kubernetes reconciler drift;
- stale PID removal without explicit exclusive maintenance ownership;
- PostgreSQL major-version mismatch;
- destructive PGDATA deletion/reinitialization;
- `docker compose down --volumes` / `-v` in the B84 apply path.
