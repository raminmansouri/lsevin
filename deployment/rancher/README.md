# Rancher

Rancher does not need a second deployment system for this application. Rancher/Fleet consumes the same standard Kubernetes resources in `deployment/kubernetes/`.

- Development cluster -> `overlays/development`
- Local production-like cluster -> `overlays/local`
- Production managed database -> `overlays/production`
- Production self-hosted database -> `overlays/production-selfhosted`

The example Fleet `GitRepo` resources in this directory deliberately target clusters by an explicit `environment` label so a local bundle cannot accidentally match a production cluster.

Secrets are created in Rancher/Kubernetes, not committed to Git. See `deployment/kubernetes/SECRET_COMMANDS.md`.
