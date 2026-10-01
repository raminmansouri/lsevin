#!/bin/sh
set -eu

K3S_HELPER_IMAGE="${K3S_HELPER_IMAGE:-rancher/k3s:v1.36.4-k3s1}"
RELEASE_DIR="${K3S_RELEASE_DIR:-/opt/lsevin/releases}"

kubectl_cmd() {
  docker run --rm --user 0:0 --network host --entrypoint kubectl \
    -v /etc/rancher/k3s/k3s.yaml:/etc/rancher/k3s/k3s.yaml:ro \
    "$K3S_HELPER_IMAGE" "$@"
}

ctr_cmd() {
  docker run --rm --user 0:0 --network host --entrypoint ctr \
    -v /run/k3s/containerd/containerd.sock:/run/k3s/containerd/containerd.sock \
    -v "$RELEASE_DIR":/releases:ro "$K3S_HELPER_IMAGE" \
    --address /run/k3s/containerd/containerd.sock --namespace k8s.io "$@"
}

verify_images() {
  available="$(ctr_cmd images list -q)"
  for image in "$@"; do
    canonical="docker.io/library/$image"
    printf '%s\n' "$available" | grep -Fqx "$canonical" || {
      echo "required staged image is missing from K3s: $canonical" >&2
      return 1
    }
  done
}

persist_images() {
  archive="${1:?archive name is required}"
  shift
  case "$archive" in */*|*..*) echo "archive must be a plain filename" >&2; return 2 ;; esac
  [ "$#" -gt 0 ] || { echo "at least one image is required" >&2; return 2; }
  mkdir -p "$RELEASE_DIR"
  candidate="$RELEASE_DIR/$archive.candidate"
  rm -f "$candidate"
  docker save -o "$candidate" "$@"
  docker run --rm --user 0:0 --entrypoint sh \
    -v "$RELEASE_DIR":/releases:ro \
    -v /var/lib/rancher/k3s/agent/images:/target \
    "$K3S_HELPER_IMAGE" -c \
    "cp '/releases/$archive.candidate' '/target/$archive.tmp' && chmod 600 '/target/$archive.tmp' && mv -f '/target/$archive.tmp' '/target/$archive'"
  rm -f "$candidate"
}

case "${1:-}" in
  import)
    shift
    archive="${1:?archive name is required}"
    shift
    case "$archive" in */*|*..*) echo "archive must be a plain filename" >&2; exit 2 ;; esac
    [ "$#" -gt 0 ] || { echo "at least one image is required" >&2; exit 2; }
    mkdir -p "$RELEASE_DIR"
    trap 'rm -f "$RELEASE_DIR/$archive"' EXIT INT TERM
    docker save -o "$RELEASE_DIR/$archive" "$@"
    ctr_cmd images import "/releases/$archive"
    verify_images "$@"
    ;;
  verify-images)
    shift
    [ "$#" -gt 0 ] || { echo "at least one image is required" >&2; exit 2; }
    verify_images "$@"
    ;;
  discard-images)
    shift
    for image in "$@"; do
      ctr_cmd images remove "docker.io/library/$image" >/dev/null 2>&1 || true
    done
    ;;
  persist-images)
    shift
    archive="${1:?archive name is required}"
    shift
    persist_images "$archive" "$@"
    ;;
  preflight)
    node_ready="$(kubectl_cmd get nodes --no-headers | awk 'NR == 1 {print $2}')"
    [ "$node_ready" = Ready ] || { echo "Kubernetes node is not Ready" >&2; exit 1; }
    kubectl_cmd get nodes -o jsonpath='{range .items[*].status.conditions[?(@.type=="DiskPressure")]}{.status}{end}' | grep -qx False || {
      echo "Kubernetes node has disk pressure; deployment was not started" >&2
      exit 1
    }
    available_kb="$(docker run --rm --entrypoint sh \
      -v /var/lib/rancher/k3s:/target:ro "$K3S_HELPER_IMAGE" \
      -c 'df -Pk /target | tail -n 1 | tr -s " " | cut -d " " -f 4')"
    [ "$available_kb" -ge 10485760 ] || {
      echo "less than 10 GiB is free; deployment was not started" >&2
      exit 1
    }
    ;;
  deploy-core)
    shift
    namespace="${1:?namespace is required}"
    tag="${2:?image tag is required}"
    "$0" preflight
    verify_images "lsevin-api:$tag" "lsevin-webapp:$tag" "lsevin-webapp-migrations:$tag"
    old_api="$(kubectl_cmd -n "$namespace" get deployment/lsevin-api -o jsonpath='{.spec.template.spec.containers[?(@.name=="api")].image}')"
    old_web="$(kubectl_cmd -n "$namespace" get deployment/lsevin-webapp -o jsonpath='{.spec.template.spec.containers[?(@.name=="web")].image}')"
    old_migrate="$(kubectl_cmd -n "$namespace" get deployment/lsevin-webapp -o jsonpath='{.spec.template.spec.initContainers[?(@.name=="migrate")].image}')"
    changed_api=false
    changed_web=false
    rollback() {
      status="$?"
      trap - EXIT INT TERM
      if [ "$status" -ne 0 ]; then
        echo "deployment failed; restoring the exact previously running images" >&2
        if [ "$changed_api" = true ]; then
          kubectl_cmd -n "$namespace" set image deployment/lsevin-api "api=$old_api" || true
          kubectl_cmd -n "$namespace" rollout status deployment/lsevin-api --timeout=10m || true
        fi
        if [ "$changed_web" = true ]; then
          kubectl_cmd -n "$namespace" set image deployment/lsevin-webapp "web=$old_web" "migrate=$old_migrate" || true
          kubectl_cmd -n "$namespace" rollout status deployment/lsevin-webapp --timeout=10m || true
        fi
      fi
      exit "$status"
    }
    trap rollback EXIT INT TERM
    kubectl_cmd -n "$namespace" patch deployment/lsevin-api --type merge \
      -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":0,"maxSurge":1}}}}'
    kubectl_cmd -n "$namespace" set image deployment/lsevin-api "api=lsevin-api:$tag"
    changed_api=true
    kubectl_cmd -n "$namespace" rollout status deployment/lsevin-api --timeout=10m
    kubectl_cmd -n "$namespace" patch deployment/lsevin-webapp --type merge \
      -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":0,"maxSurge":1}}}}'
    kubectl_cmd -n "$namespace" set image deployment/lsevin-webapp \
      "web=lsevin-webapp:$tag" "migrate=lsevin-webapp-migrations:$tag"
    changed_web=true
    kubectl_cmd -n "$namespace" rollout status deployment/lsevin-webapp --timeout=10m
    # K3s imports archives from this directory on startup. Keep the exact
    # last-known-good release durable so a node/containerd restart cannot turn
    # local-only images into ImagePullBackOff and take the application down.
    persist_images lsevin-core-current.tar \
      "lsevin-api:$tag" "lsevin-webapp:$tag" "lsevin-webapp-migrations:$tag"
    trap - EXIT INT TERM
    ;;
  deploy-api)
    shift
    namespace="${1:?namespace is required}"
    tag="${2:?image tag is required}"
    "$0" preflight
    verify_images "lsevin-api:$tag"
    old_api="$(kubectl_cmd -n "$namespace" get deployment/lsevin-api -o jsonpath='{.spec.template.spec.containers[?(@.name=="api")].image}')"
    rollback_api() {
      status="$?"
      trap - EXIT INT TERM
      if [ "$status" -ne 0 ]; then
        echo "API deployment failed; restoring $old_api" >&2
        kubectl_cmd -n "$namespace" set image deployment/lsevin-api "api=$old_api" || true
        kubectl_cmd -n "$namespace" rollout status deployment/lsevin-api --timeout=10m || true
      fi
      exit "$status"
    }
    trap rollback_api EXIT INT TERM
    kubectl_cmd -n "$namespace" patch deployment/lsevin-api --type merge \
      -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":0,"maxSurge":1}}}}'
    kubectl_cmd -n "$namespace" set image deployment/lsevin-api "api=lsevin-api:$tag"
    kubectl_cmd -n "$namespace" rollout status deployment/lsevin-api --timeout=10m
    persist_images lsevin-api-current.tar "lsevin-api:$tag"
    trap - EXIT INT TERM
    ;;
  deploy-web)
    shift
    namespace="${1:?namespace is required}"
    web_tag="${2:?web image tag is required}"
    migration_tag="${3:-}"
    "$0" preflight
    verify_images "lsevin-webapp:$web_tag"
    if [ -n "$migration_tag" ]; then
      verify_images "lsevin-webapp-migrations:$migration_tag"
    fi
    old_web="$(kubectl_cmd -n "$namespace" get deployment/lsevin-webapp -o jsonpath='{.spec.template.spec.containers[?(@.name=="web")].image}')"
    old_migrate="$(kubectl_cmd -n "$namespace" get deployment/lsevin-webapp -o jsonpath='{.spec.template.spec.initContainers[?(@.name=="migrate")].image}')"
    rollback_web() {
      status="$?"
      trap - EXIT INT TERM
      if [ "$status" -ne 0 ]; then
        echo "web deployment failed; restoring $old_web and $old_migrate" >&2
        kubectl_cmd -n "$namespace" set image deployment/lsevin-webapp "web=$old_web" "migrate=$old_migrate" || true
        kubectl_cmd -n "$namespace" rollout status deployment/lsevin-webapp --timeout=10m || true
      fi
      exit "$status"
    }
    trap rollback_web EXIT INT TERM
    kubectl_cmd -n "$namespace" patch deployment/lsevin-webapp --type merge \
      -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":0,"maxSurge":1}}}}'
    if [ -n "$migration_tag" ]; then
      kubectl_cmd -n "$namespace" set image deployment/lsevin-webapp \
        "web=lsevin-webapp:$web_tag" "migrate=lsevin-webapp-migrations:$migration_tag"
    else
      kubectl_cmd -n "$namespace" set image deployment/lsevin-webapp "web=lsevin-webapp:$web_tag"
    fi
    kubectl_cmd -n "$namespace" rollout status deployment/lsevin-webapp --timeout=10m
    if [ -n "$migration_tag" ]; then
      persist_images lsevin-webapp-current.tar \
        "lsevin-webapp:$web_tag" "lsevin-webapp-migrations:$migration_tag"
    else
      persist_images lsevin-webapp-current.tar "lsevin-webapp:$web_tag"
    fi
    trap - EXIT INT TERM
    ;;
  kubectl)
    shift
    kubectl_cmd "$@"
    ;;
  *)
    echo "usage: $0 import ARCHIVE IMAGE... | verify-images IMAGE... | discard-images IMAGE... | persist-images ARCHIVE IMAGE... | preflight | deploy-core NAMESPACE TAG | deploy-api NAMESPACE TAG | deploy-web NAMESPACE WEB_TAG [MIGRATION_TAG] | kubectl ARGS..." >&2
    exit 2
    ;;
esac
