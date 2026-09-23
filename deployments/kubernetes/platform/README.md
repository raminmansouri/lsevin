# LSevin Kubernetes platform

## Current production topology (2026-09-22)

Production runs on single-node K3s. The API, main/financial webapp, CRM,
providers portal, background workers, PostgreSQL, PgBouncer, Redis,
EventStoreDB, MinIO, Elasticsearch, Prometheus, Grafana, Kibana, Fluent Bit,
OpenTelemetry Collector, Blackbox Exporter, and database exporters run in the
`lsevin` namespace. Caddy remains the TLS edge and Jenkins remains the build
controller; both proxy/deploy into K3s.

The Docker-hosted Caddy edge reaches the main webapp through NodePort `30080`,
the API/CRM/Providers services through `30081`–`30083`, and MinIO media reads
through the dedicated `minio-edge` NodePort `30900`.
`Caddyfile.server` uses `K3S_NODE_ADDRESS` for both bridges; do not point its
`/files/*` handlers at the retired Docker DNS name `minio`.

The production cutover overlay is `deployments/kubernetes/hybrid`. Its
`stateful-hostpath.yaml` deliberately attaches the retained Docker data
directories as read/write `hostPath` volumes. This is a single-node migration
layout: do not schedule those datastore pods on another node. Before moving to
a multi-node cluster, migrate these paths to replicated CSI volumes or managed
services.

CloudNativePG 1.30.0 is installed as the PostgreSQL lifecycle operator. The
validated three-node PostgreSQL/PgBouncer target is kept under
`deployments/kubernetes/cloudnative-pg`; it is intentionally not part of the
live overlay until two additional nodes, external object storage, and the
database import/failover test are ready.

Render and validate the production overlay with the required load-restrictor
setting:

```sh
kubectl kustomize --load-restrictor=LoadRestrictionsNone \
  deployments/kubernetes/hybrid > rendered.yaml
kubectl apply --dry-run=server -f rendered.yaml
```

The stopped Compose datastore containers are retained only for rollback and
have restart policy `no`; starting them while the K3s datastore pods are
running would cause two processes to own the same data directories. The final
pre-cutover backup is stored under
`/opt/lsevin/backups/k8s-final-cutover-20260922T164000Z` on the production
server.

The production Jenkins jobs `lsevin-main-production`,
`lsevin-crm-production`, and `lsevin-providers-production` build immutable
images, import them into K3s containerd, update the appropriate Deployments,
wait for rollouts, and undo failed rollouts. Their installed definitions are
bootstrapped by `deployments/jenkins/install-kubernetes-pipelines.groovy` until
the corresponding Jenkinsfiles are committed to their upstream repositories.

Grafana and Kibana retain internal ClusterIP services. Dedicated edge services
use NodePorts `30084` and `30085` only for the Docker-hosted Caddy bridge.
Public access is available at `grafana.lsevin.com` (Grafana's native login) and
`kibana.lsevin.com` (Caddy basic authentication). Only the Kibana bcrypt hash is
stored in `Caddyfile.server`; keep its plaintext password in the deployment
password manager, never in source control. For emergency local access:

```sh
kubectl -n lsevin port-forward service/grafana 3000:3000
kubectl -n lsevin port-forward service/kibana 5601:5601
```

This Kustomize deployment replaces the production Docker Compose topology for
the LSevin API/webapp (including the financial site), CRM, and the providers
portal. It also deploys PostgreSQL, Redis, EventStoreDB, MinIO,
Elasticsearch, Prometheus, Grafana, Kibana, and Fluent Bit.

## Cluster prerequisites

- Kubernetes 1.30+ with a default `StorageClass`
- ingress-nginx and cert-manager (`letsencrypt-production` ClusterIssuer)
- a container registry reachable by every node
- `kubectl` with server-side apply support

For production, use a managed or highly available PostgreSQL service instead
of the included single-replica StatefulSet. Take and test a backup before moving
the Docker volumes. The Kubernetes deployment does not copy existing data.

## One-time setup

1. Create the namespace, copy `secrets.example.yaml` to a file outside Git,
   replace every value, and apply it. Create the registry pull secret and
   ingress basic-auth secret:

   ```sh
   kubectl apply -f deployments/kubernetes/platform/namespace.yaml
   kubectl apply -f /secure/path/platform-secrets.yaml
   kubectl -n lsevin create secret docker-registry registry-credentials \
     --docker-server=REGISTRY --docker-username=USER --docker-password=PASSWORD
   htpasswd -nb admin 'PASSWORD' > auth
   kubectl -n lsevin create secret generic observability-basic-auth --from-file=auth
   ```

2. Update registry names, domains, storage sizes, and resource limits for the
   target cluster. Validate without changing the cluster:

   ```sh
   kubectl kustomize deployments/kubernetes/platform > rendered.yaml
   kubectl apply --server-side --dry-run=server -f rendered.yaml
   ```

3. Deploy and wait for rollouts:

   ```sh
   kubectl apply --server-side -k deployments/kubernetes/platform
   kubectl -n lsevin rollout status statefulset/postgres --timeout=10m
   kubectl -n lsevin rollout status deployment/lsevin-api --timeout=10m
   kubectl -n lsevin rollout status deployment/lsevin-webapp --timeout=10m
   kubectl -n lsevin rollout status deployment/crm --timeout=10m
   kubectl -n lsevin rollout status deployment/lsevin-portal --timeout=10m
   ```

Prometheus discovers pods carrying `prometheus.io/*` annotations and scrapes
the PostgreSQL, Redis, and Elasticsearch exporters. Blackbox Exporter monitors
all app readiness endpoints and Kibana. Grafana is provisioned with Prometheus
and Elasticsearch data sources. Fluent Bit collects container logs from every
node into daily `kubernetes-logs-*` indexes, which Kibana can query.

## Jenkins credentials

Each Kubernetes pipeline expects these Jenkins credentials:

- `lsevin-registry`: username/password for the image registry
- `lsevin-kubeconfig`: Secret file containing a restricted kubeconfig
- `lsevin-build-env`: Secret file containing the core webapp's production
  `NEXT_PUBLIC_*`, `DATABASE_URL`, `AUTH_SECRET`, and `WEBHOOK_KEY` build values

Set `REGISTRY` in each Jenkinsfile. The kubeconfig identity needs image update,
Job, pod/log, and rollout permissions only in the `lsevin` namespace. Jenkins
builds immutable Git-SHA tags, pushes them, updates the image, and waits for the
rollout. Kubernetes automatically retains ReplicaSets for rollback.

## Migration order

1. Lower DNS TTL.
2. Stop writes briefly, back up Docker PostgreSQL, Elasticsearch, EventStoreDB,
   and MinIO, then restore them into Kubernetes or their managed replacements.
3. Run database migrations, perform endpoint and dashboard checks, then switch
   DNS to ingress-nginx.
4. Keep the Compose stack stopped but intact through the rollback window.
