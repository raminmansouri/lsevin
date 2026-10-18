#!/usr/bin/env python3
"""k8s-clean.py - turns the `kubectl get <kind> -o yaml` exports inside a config bundle into objects that can be applied to a NEW cluster.
Strips the server-assigned fields (uid, resourceVersion, status, clusterIP, ...), skips objects that Kubernetes creates itself.
  k8s-clean.py DIR KIND [--only a,b] [--except a,b]     prints a multi-document YAML to stdout   (DIR holds secret.yaml, deployment.yaml, ...)
"""
import os, sys
import yaml

SKIP_NAMES = {("service", "kubernetes"), ("configmap", "kube-root-ca.crt")}
DROP_META = ("uid", "resourceVersion", "creationTimestamp", "generation", "managedFields", "selfLink", "deletionTimestamp", "deletionGracePeriodSeconds")
DROP_ANN = ("kubectl.kubernetes.io/last-applied-configuration", "deployment.kubernetes.io/revision", "pv.kubernetes.io/bind-completed",
            "pv.kubernetes.io/bound-by-controller", "volume.kubernetes.io/selected-node", "volume.beta.kubernetes.io/storage-provisioner",
            "volume.kubernetes.io/storage-provisioner")


def clean(o, kind):
    md = o.get("metadata", {})
    for k in DROP_META:
        md.pop(k, None)
    ann = md.get("annotations") or {}
    for k in DROP_ANN:
        ann.pop(k, None)
    if ann:
        md["annotations"] = ann
    else:
        md.pop("annotations", None)
    o.pop("status", None)
    spec = o.get("spec") or {}
    if kind == "service":
        for k in ("clusterIP", "clusterIPs", "ipFamilies", "ipFamilyPolicy", "internalTrafficPolicy"):
            spec.pop(k, None)
    if kind == "persistentvolumeclaim":
        spec.pop("volumeName", None)
    if kind == "cronjob":
        spec.pop("suspend", None) if spec.get("suspend") is False else None
    return o


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    d, kind = a[0], a[1]
    only = set(a[a.index("--only") + 1].split(",")) if "--only" in a else None
    exc = set(a[a.index("--except") + 1].split(",")) if "--except" in a else set()
    path = os.path.join(d, kind + ".yaml")
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return
    docs = yaml.safe_load(open(path, encoding="utf-8")) or {}
    out = []
    for o in docs.get("items", []):
        name = o["metadata"]["name"]
        if (kind, name) in SKIP_NAMES or o["metadata"].get("ownerReferences"):
            continue
        if kind == "secret" and (o.get("type", "") == "kubernetes.io/service-account-token" or o.get("type", "").startswith("helm.sh/")):
            continue
        if only is not None and name not in only:
            continue
        if name in exc:
            continue
        out.append(clean(o, kind))
    if out:
        sys.stdout.write(yaml.safe_dump_all(out, default_flow_style=False, sort_keys=False))


main()
