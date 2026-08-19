# syntax=docker/dockerfile:1.7

# PostgreSQL is the migration runtime. No Node or shell migration runner exists.
FROM postgres:17-alpine

COPY deployment/database/migrate.sql /migrations/migrate.sql
COPY src/core/migrations/ /migrations/core/
COPY src/modules/ /migrations/modules/

ENTRYPOINT ["psql"]
# Production-safe default: never restore a database backup implicitly.
CMD ["-v", "ON_ERROR_STOP=1", "-v", "allow_bootstrap=false", "-f", "/migrations/migrate.sql"]
