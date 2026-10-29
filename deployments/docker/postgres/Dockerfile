ARG POSTGRES_IMAGE_TAG=17.10-alpine
FROM postgres:${POSTGRES_IMAGE_TAG}

# Keep the PostgreSQL image on Alpine/musl, matching the existing production
# volume, while adding pgBackRest for physical backups and point-in-time restore.
RUN apk add --no-cache       bash       ca-certificates       curl       pgbackrest       tzdata       zstd

# pgvector, for the assistant's knowledge search (RAG; migration 0084). Same build as
# postgres.dev.Dockerfile: from source on this Alpine/PostgreSQL 17 base, build tools
# removed again. with_llvm=no: no JIT bitcode. OPTFLAGS="": portable, no -march=native.
ARG PGVECTOR_VERSION=v0.8.1
RUN apk add --no-cache --virtual .pgvector-build git build-base \
 && git clone --branch "${PGVECTOR_VERSION}" --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
 && make -C /tmp/pgvector with_llvm=no OPTFLAGS="" \
 && make -C /tmp/pgvector install with_llvm=no \
 && rm -rf /tmp/pgvector \
 && apk del .pgvector-build