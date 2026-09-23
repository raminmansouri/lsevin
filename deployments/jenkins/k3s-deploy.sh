#!/bin/sh
set -eu

K3S_HELPER_IMAGE="${K3S_HELPER_IMAGE:-rancher/k3s:v1.36.4-k3s1}"
RELEASE_DIR="${K3S_RELEASE_DIR:-/opt/lsevin/releases}"

case "${1:-}" in
  import)
    shift
    archive="${1:?archive name is required}"
    shift
    case "$archive" in */*|*..*) echo "archive must be a plain filename" >&2; exit 2 ;; esac
    [ "$#" -gt 0 ] || { echo "at least one image is required" >&2; exit 2; }
    mkdir -p "$RELEASE_DIR"
    docker save -o "$RELEASE_DIR/$archive" "$@"
    docker run --rm --user 0:0 --network host \
      --entrypoint ctr \
      -v /run/k3s/containerd/containerd.sock:/run/k3s/containerd/containerd.sock \
      -v "$RELEASE_DIR":/releases:ro \
      "$K3S_HELPER_IMAGE" \
      --address /run/k3s/containerd/containerd.sock \
      --namespace k8s.io images import "/releases/$archive"
    rm -f "$RELEASE_DIR/$archive"
    ;;
  kubectl)
    shift
    docker run --rm --user 0:0 --network host \
      --entrypoint kubectl \
      -v /etc/rancher/k3s/k3s.yaml:/etc/rancher/k3s/k3s.yaml:ro \
      "$K3S_HELPER_IMAGE" "$@"
    ;;
  *)
    echo "usage: $0 import ARCHIVE IMAGE... | kubectl ARGS..." >&2
    exit 2
    ;;
esac

