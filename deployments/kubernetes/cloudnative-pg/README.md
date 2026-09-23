# CloudNativePG

CloudNativePG `1.30.0` is pinned by checksum in `install-operator.sh`. The
operator may be installed independently of the existing PostgreSQL deployment.

`production-cluster.yaml` is the intended three-node PostgreSQL 17.10 and
PgBouncer topology. It is deliberately not included by the production
Kustomization yet: applying it on the current single node would leave replicas
and poolers unschedulable, and an empty cluster must never replace the live
database.

Before cutover:

1. Add two worker nodes with independent SSD/NVMe storage.
2. Configure an external S3-compatible destination through the Barman Cloud
   plugin for WAL archiving, scheduled backups, retention, encryption, and PITR.
3. Bootstrap a migration cluster from the existing PostgreSQL instance.
4. Validate row counts, extensions, roles, restore, PgBouncer, and failover.
5. Switch application connection strings during an announced maintenance step.
