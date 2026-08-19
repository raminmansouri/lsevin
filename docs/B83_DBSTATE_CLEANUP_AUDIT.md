# B83 DBSTATE cleanup audit

Observed runtime sequence:

1. PostgreSQL single-user password reconciliation completed successfully.
2. The script printed the success message.
3. The EXIT cleanup trap tried to remove `/dev/null` and failed with permission denied.
4. The one-shot `dbstate` service therefore returned exit code 1, preventing PostgreSQL startup.

B83 removes the sentinel design completely. The maintenance SQL is streamed to PostgreSQL, while the only temporary artifact is a diagnostic log whose cleanup target is restricted to the script-owned `lsevin-dbstate.*` namespace under `$TMPDIR`.

The deployment validator rejects `/dev/null` cleanup sentinels, SQL temp files, destructive PGDATA operations, and Docker/Kubernetes reconciler drift.
