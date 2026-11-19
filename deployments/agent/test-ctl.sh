#!/bin/bash
# Tests of the lsevin-agent-ctl allow-list. No cluster needed: kubectl/systemctl/docker are replaced by "echo".
# Run: bash deployments/agent/test-ctl.sh      (exit code 0 = all pass)
here=$(cd "$(dirname "$0")" && pwd)
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
for b in systemctl docker journalctl; do printf '#!/bin/sh\necho "$0 $@"\n' > "$tmp/$b"; chmod +x "$tmp/$b"; done
export PATH="$tmp:$PATH" LSEVIN_AGENT_KUBECTL="echo KUBECTL" LSEVIN_AGENT_CTL_LOG="$tmp/ctl.log"
pass=0; fail=0
ok()   { out=$("$here/lsevin-agent-ctl" "$@" 2>&1); rc=$?; if [ $rc -eq 0 ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL (should be allowed): $* -> $out"; fi; }
no()   { out=$("$here/lsevin-agent-ctl" "$@" 2>&1); rc=$?; if [ $rc -eq 13 ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL (should be DENIED, rc=$rc): $* -> $out"; fi; }

# allowed
ok kubectl get pods
ok kubectl get pods -A -o wide
ok kubectl describe pod lsevin-webapp-abc
ok kubectl top pod
ok kubectl logs deploy/lsevin-api --since=10m
ok kubectl rollout status deployment/lsevin-webapp
ok kubectl rollout restart deployment/lsevin-webapp
ok kubectl rollout restart deployment/lsevin-api
ok kubectl rollout restart deployment/kibana
ok kubectl delete pod lsevin-webapp-769b8f8cbd-vdbc5
ok systemctl is-active lsevin-alerter
ok systemctl restart lsevin-webapp-cache-recycle.service
ok systemctl start lsevin-es-retention.service
ok journalctl -k --since -1h
ok docker ps
ok docker system df
ok docker logs lsevin-jenkins --tail 20

# denied: stateful / destructive / secrets / escape hatches
no kubectl rollout restart deployment/postgres
no kubectl rollout restart deployment/redis
no kubectl rollout restart deployment/elasticsearch
no kubectl rollout restart deployment/pgbouncer
no kubectl rollout restart deployment/lsevin-webapp deployment/postgres
no kubectl rollout undo deployment/lsevin-api
no kubectl delete pod postgres-659b67b486-4lg6l
no kubectl delete pod eventstore-7b6bbd6fc6-qsq5c
no kubectl delete pod elasticsearch-7f8cb68988-hsr2r
no kubectl delete pod --all
no kubectl delete deployment lsevin-webapp
no kubectl delete pvc data
no kubectl delete ns lsevin
no kubectl exec -it postgres-659b67b486-4lg6l -- psql
no kubectl scale deployment/lsevin-webapp --replicas=0
no kubectl apply -f x.yaml
no kubectl patch deployment lsevin-webapp -p '{}'
no kubectl get secrets
no kubectl get secret webapp-secrets -o yaml
no kubectl get pods -o yaml --namespace kube-system
no kubectl get pods -n kube-system
no kubectl get pods --kubeconfig /root/x
no kubectl logs deploy/lsevin-api -f
no kubectl describe pod -A
no systemctl stop lsevin-alerter
no systemctl restart docker
no systemctl restart k3s
no systemctl restart openvpn-client@lsevin-vpn
no systemctl restart ssh
no systemctl disable lsevin-alerter
no docker inspect lsevin-jenkins
no docker logs lsevin-jenkins -f
no journalctl --vacuum-size=1M
no journalctl --rotate
ok docker stats
no docker rm -f lsevin-jenkins
no docker system prune -af
no docker volume prune
no docker exec lsevin-jenkins sh
no docker run --rm -v /:/h alpine sh
no probe file:///etc/passwd
no probe 'http://x;reboot'
no reboot
no bash -c id
no ''

echo "passed=$pass failed=$fail"
[ $fail -eq 0 ]
