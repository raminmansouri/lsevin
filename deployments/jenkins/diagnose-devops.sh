#!/usr/bin/env bash
set -Eeuo pipefail

echo '== DNS =='
getent ahostsv4 devops.lsevin.com || true

echo
echo '== Production environment =='
grep '^JENKINS_DOMAIN=' /opt/lsevin-new/deployments/docker/.env || true

echo
echo '== Jenkins container =='
docker inspect --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} networks={{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' lsevin-jenkins || true

echo
echo '== Jenkins internal HTTP =='
docker exec lsevin-jenkins curl -fsSI --max-time 10 http://127.0.0.1:8080/login || true

echo
echo '== Jenkins from Caddy network =='
docker exec docker-caddy-1 wget -S -O /dev/null http://jenkins:8080/login 2>&1 || true

echo
echo '== Caddy Jenkins block =='
docker exec docker-caddy-1 sh -lc "grep -n -A12 -B4 -E 'JENKINS_DOMAIN|devops\\.lsevin\\.com|jenkins\\.lsevin\\.com|reverse_proxy jenkins|unix//run/jenkins' /etc/caddy/Caddyfile" || true

echo
echo '== Caddy validation =='
docker exec docker-caddy-1 caddy validate --config /etc/caddy/Caddyfile || true

echo
echo '== Public HTTP =='
curl -vkI --connect-timeout 10 --max-time 20 https://devops.lsevin.com/login || true
