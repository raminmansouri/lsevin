# Build resource limits on server B (memory_critical 2026-11-15)

**Incident:** 2026-11-15 09:33 UTC Jenkins `lsevin-main-production #462` ran `next build` for the webapp. The build process reached 4.3 GB RSS and
~460% CPU; available memory on B (16 GB) fell to 3.57% (`memory_critical`), load average 16. It finished successfully and memory recovered by
09:50. No process was OOM-killed (8 GB swap, 7 GB free).

**Root cause:** the limits in `Jenkinsfile.main` (`DOCKER_BUILD_LIMITS = --resource cpu-quota=100000 --resource memory=2560m ...`) are NOT
enforced for the webapp build: it runs with `DOCKER_BUILDKIT=1` and the embedded BuildKit ignores them (the build used 4.3 GB > 2.5 GB cap).
The pre-build guard in `k3s-deploy.sh` (needs 2800 MB available, load <= 6) only checks the START: B idles with ~4.1 GB available, so the
guard passes and the build then takes more than is free. B runs ~10 GB of production services (postgres, 2 webapp replicas, elasticsearch,
kibana, eventstore, seaweedfs ...).

**Fix applied on B (host level, effective whatever BuildKit does), 2026-11-15:**
```sh
sudo systemctl set-property docker.service MemoryHigh=4500M CPUQuota=300%
```
Builds run in child cgroups of `docker.service`; Jenkins, Caddy and the panel run in their own `docker-<id>.scope` units and are not affected.
`MemoryHigh` is a soft ceiling: the build is throttled / swapped, never killed. `CPUQuota=300%` leaves about 5 of the 8 cores to the site.
Persisted in `/etc/systemd/system.control/docker.service.d/50-MemoryHigh.conf` and `50-CPUQuota.conf`.
Undo: `sudo systemctl revert docker.service`.

**Check at the next release build:** build still succeeds (it may take longer), `memory_low` does not fire, `curl https://appmain.lsevin.com/app-health` stays 204.
If builds start failing or take more than ~30 minutes, raise `MemoryHigh` (6000M) rather than removing the cap.

**Not changed:** `Jenkinsfile.main` (the dead `--resource` flags are harmless but misleading), Next/Dockerfile heap settings, the monitoring thresholds,
and the always-on services (kibana ~560 MB is the obvious candidate if more headroom is needed).
