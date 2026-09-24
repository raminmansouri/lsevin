[CmdletBinding()]
param(
    [ValidateSet('kind', 'current')]
    [string]$Provider = 'kind',
    [string]$ClusterName = 'lsevin-dev'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$image = 'lsevin-dev-postgres:local'

foreach ($command in @('docker', 'kubectl')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Required command '$command' was not found."
    }
}

Push-Location $repoRoot
try {
    docker build -f deployments/docker/postgres.dev.Dockerfile -t $image .

    if ($Provider -eq 'kind') {
        if (-not (Get-Command kind -ErrorAction SilentlyContinue)) {
            throw "kind is required for -Provider kind. Install it from https://kind.sigs.k8s.io/."
        }
        $clusters = @(kind get clusters 2>$null)
        if ($clusters -notcontains $ClusterName) {
            kind create cluster --name $ClusterName --config deployments/kubernetes/development/kind-config.yaml
        }
        kubectl config use-context "kind-$ClusterName" | Out-Null
        kind load docker-image $image --name $ClusterName
    }

    # Create the namespace first so a clean cluster does not fail while removing
    # a completed init job from a namespace that does not exist yet.
    kubectl apply -f deployments/kubernetes/development/namespace.yaml | Out-Null
    kubectl delete job seaweedfs-init -n lsevin-dev --ignore-not-found | Out-Null
    kubectl apply -k deployments/kubernetes/development
    kubectl rollout status statefulset/postgres -n lsevin-dev --timeout=300s
    kubectl rollout status deployment/redis -n lsevin-dev --timeout=180s
    kubectl rollout status deployment/eventstore -n lsevin-dev --timeout=180s
    kubectl rollout status statefulset/seaweedfs -n lsevin-dev --timeout=180s
    kubectl wait --for=condition=complete job/seaweedfs-init -n lsevin-dev --timeout=180s
}
finally {
    Pop-Location
}

Write-Host 'LSevin development infrastructure is ready:'
Write-Host '  PostgreSQL:  localhost:5432 (lsevin / lsevin)'
Write-Host '  Redis:       localhost:6379'
Write-Host '  EventStore:  http://localhost:2113'
Write-Host '  SeaweedFS S3:     http://localhost:9000'
Write-Host '  SeaweedFS master: http://localhost:9333'
