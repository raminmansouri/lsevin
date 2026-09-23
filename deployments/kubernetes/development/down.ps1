[CmdletBinding()]
param(
    [ValidateSet('kind', 'current')]
    [string]$Provider = 'kind',
    [string]$ClusterName = 'lsevin-dev',
    [switch]$DeleteData
)

$ErrorActionPreference = 'Stop'

if ($Provider -eq 'kind' -and $DeleteData) {
    kind delete cluster --name $ClusterName
    exit 0
}

if ($DeleteData) {
    kubectl delete -k $PSScriptRoot --ignore-not-found
    exit 0
}

kubectl scale statefulset/postgres statefulset/minio -n lsevin-dev --replicas=0
kubectl scale deployment/redis deployment/eventstore -n lsevin-dev --replicas=0
kubectl delete job/minio-init -n lsevin-dev --ignore-not-found
