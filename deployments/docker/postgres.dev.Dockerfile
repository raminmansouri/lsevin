FROM postgres:17.10-alpine

# Development-only bootstrap image. These files execute only when PostgreSQL
# initializes an empty volume; existing developer volumes are never overwritten.
COPY auto_backups/schema_backup.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY deployments/docker/dev-seed/05_ef_migration_baseline.sql /docker-entrypoint-initdb.d/05_ef_migration_baseline.sql
COPY deployments/docker/dev-seed/10_dev_seed.sql /docker-entrypoint-initdb.d/10_dev_seed.sql
