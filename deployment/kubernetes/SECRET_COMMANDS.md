# Kubernetes Secrets

Create secrets outside Git. The portal uses separate database identities for schema publication and normal runtime access.

## Local/self-hosted learning cluster

For the simplest local setup, both secrets may temporarily use the PostgreSQL `postgres` account. Use a limited runtime role in real production.

```bash
kubectl -n lsevin-providers create secret generic providers-db-admin \
  --from-literal=PGUSER='postgres' \
  --from-literal=PGPASSWORD='LOCAL_POSTGRES_PASSWORD'

kubectl -n lsevin-providers create secret generic providers-db-runtime \
  --from-literal=PGUSER='postgres' \
  --from-literal=PGPASSWORD='LOCAL_POSTGRES_PASSWORD'
```

## Production

`providers-db-admin` should be a dedicated migration account with DDL permission. `providers-db-runtime` should have only the permissions required by the web application.

```bash
kubectl -n lsevin-providers create secret generic providers-db-admin \
  --from-literal=PGUSER='providers_portal_migrator' \
  --from-literal=PGPASSWORD='MIGRATION_PASSWORD'

kubectl -n lsevin-providers create secret generic providers-db-runtime \
  --from-literal=PGUSER='providers_portal_app' \
  --from-literal=PGPASSWORD='RUNTIME_PASSWORD'
```

Create the portal SSO/session secret separately:

```bash
kubectl -n lsevin-providers create secret generic providers-portal-secrets \
  --from-literal=LSEVIN_SSO_URL='https://appmain.lsevin.com' \
  --from-literal=PROVIDER_PORTAL_SSO_SECRET='CHANGE_ME' \
  --from-literal=PROVIDER_PORTAL_SESSION_SECRET='CHANGE_ME'
```
