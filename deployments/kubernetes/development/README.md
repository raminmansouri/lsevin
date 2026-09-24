# Local Kubernetes development

This overlay runs disposable PostgreSQL, Redis, EventStoreDB, and SeaweedFS on a
developer workstation. The API and webapp continue to run natively with hot
reload, using the same localhost endpoints as the Docker Compose workflow.
Nothing here connects to or contains production credentials.

## Requirements

- Docker Desktop (Linux containers)
- `kubectl`
- `kind` for the recommended isolated cluster, or Docker Desktop Kubernetes
- PowerShell 7 or Windows PowerShell 5.1

The workstation should have at least 6 GB available to Docker. Ports 5432,
6379, 2113, 9000, and 9333 must be free.

## Start with kind (recommended)

From the repository root:

```powershell
./deployments/kubernetes/development/up.ps1
```

The script builds the development PostgreSQL image containing the local schema
and seed, creates an isolated `lsevin-dev` kind cluster, loads the image, applies
the manifests, and waits for every dependency.

If this kind cluster was created by the former MinIO configuration, recreate it
once so the master diagnostic port changes from `9001` to `9333`:

```powershell
./deployments/kubernetes/development/down.ps1 -DeleteData
./deployments/kubernetes/development/up.ps1
```

To use the currently selected Kubernetes context instead:

```powershell
./deployments/kubernetes/development/up.ps1 -Provider current
```

Docker Desktop Kubernetes can use the locally built image directly. Other
clusters need a registry or their own image-loading command.

## Run the applications with hot reload

API, from the repository root:

```powershell
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:ASPNETCORE_URLS='http://localhost:5003'
$env:ConnectionStrings__database='Host=localhost;Port=5432;Database=lsevin;Username=lsevin;Password=lsevin;Include Error Detail=true'
$env:ConnectionStrings__cache='localhost:6379'
$env:ConnectionStrings__eventstore='esdb://localhost:2113?tls=false'
dotnet watch --project src/API/LSevin.Api
```

Webapp, in another terminal:

```powershell
cd frontend/webapp
pnpm install
pnpm dev
```

The existing `frontend/webapp/.env.local` points at these local endpoints. Open
`http://localhost:3000`; the API is at `http://localhost:5003`.

## Stop or reset

```powershell
# Stop workloads while retaining the cluster and database/object data:
./deployments/kubernetes/development/down.ps1

# Delete the entire kind cluster and all local data:
./deployments/kubernetes/development/down.ps1 -DeleteData
```

All credentials in this overlay are intentionally local and disposable. Never
reuse them in shared, staging, or production environments.
