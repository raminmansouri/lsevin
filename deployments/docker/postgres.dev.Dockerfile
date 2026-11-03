FROM postgres:17.10-alpine

# pgvector, for the assistant's knowledge search (RAG). Built from source on the same
# Alpine/PostgreSQL 17 base; build tools are removed again to keep the image small.
# with_llvm=no: skip JIT bitcode (jit is off anyway). OPTFLAGS="": portable build, no -march=native.
ARG PGVECTOR_VERSION=v0.8.1
RUN apk add --no-cache --virtual .pgvector-build git build-base \
 && git clone --branch "${PGVECTOR_VERSION}" --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
 && make -C /tmp/pgvector with_llvm=no OPTFLAGS="" \
 && make -C /tmp/pgvector install with_llvm=no \
 && rm -rf /tmp/pgvector \
 && apk del .pgvector-build

# Development-only bootstrap image. These files execute only when PostgreSQL
# initializes an empty volume; existing developer volumes are never overwritten.
COPY auto_backups/schema_backup.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY deployments/docker/dev-seed/05_ef_migration_baseline.sql /docker-entrypoint-initdb.d/05_ef_migration_baseline.sql
COPY deployments/docker/dev-seed/10_dev_seed.sql /docker-entrypoint-initdb.d/10_dev_seed.sql
