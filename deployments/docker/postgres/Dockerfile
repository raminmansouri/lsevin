ARG POSTGRES_IMAGE_TAG=17.10-alpine
FROM postgres:${POSTGRES_IMAGE_TAG}

# Keep the PostgreSQL image on Alpine/musl, matching the existing production
# volume, while adding pgBackRest for physical backups and point-in-time restore.
RUN apk add --no-cache       bash       ca-certificates       curl       pgbackrest       tzdata       zstd
