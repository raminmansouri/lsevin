#!/usr/bin/env bash
# Run ON SERVER A as root. Puts A's sequences in their own number range and installs the SymmetricDS client
# (not started). Run AFTER the hub on B is up (b-01..b-03) and AFTER deployments/sync/sync-b-to-a.sh has
# refreshed A's database from B. Needs /root/symmetric-server-3.16.17.zip (A cannot reach SourceForge).
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd); VER=3.16.17; BASE=/opt/symds; NODE=$BASE/node-a
ZIP=/root/symmetric-server-$VER.zip
[ -f "$ZIP" ] || { echo "copy symmetric-server-$VER.zip to $ZIP first"; exit 1; }

k3s kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U "$POSTGRES_USER" -d lsevin -X -q' < "$HERE/sql/sequence-ranges-node-a.sql" 2>&1 \
  | grep -c "NOTICE.*next" | sed 's/^/sequences moved into the A range: /'

mkdir -p $BASE; rm -rf $NODE; mkdir -p $NODE; unzip -q "$ZIP" -d $NODE
mv $NODE/symmetric-server-$VER/* $NODE/; rmdir $NODE/symmetric-server-$VER; chmod +x $NODE/bin/*
IP=$(k3s kubectl -n lsevin get svc postgres -o jsonpath='{.spec.clusterIP}')
U=$(k3s kubectl -n lsevin get secret data-secrets -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)
W=$(k3s kubectl -n lsevin get secret data-secrets -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
cat > $NODE/engines/nodea.properties <<P
engine.name=nodea
group.id=client
external.id=001
db.driver=org.postgresql.Driver
db.url=jdbc:postgresql://$IP:5432/lsevin
db.user=$U
db.password=$W
db.init.sql=set session_replication_role = replica
registration.url=https://api.lsevin.com/symds/hub
sync.url=http://127.0.0.1:31416/sync/nodea
auto.reload=false
job.routing.period.time.ms=2000
job.push.period.time.ms=3000
job.pull.period.time.ms=3000
P
chmod 600 $NODE/engines/nodea.properties
sed -i "s/^http.port=.*/http.port=31416/; s/^https.port=.*/https.port=31418/; s/^host.bind.name=.*/host.bind.name=127.0.0.1/" $NODE/conf/symmetric-server.properties
cat > /etc/systemd/system/symds-node-a.service <<U
[Unit]
Description=SymmetricDS node A (connects OUT to the hub on B)
After=network-online.target k3s.service lsevin-vpn-manager.service
Wants=network-online.target
[Service]
WorkingDirectory=$NODE
Environment=JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
Environment=JAVA_OPTS=-Xms64m -Xmx512m
ExecStart=$NODE/bin/sym
Restart=on-failure
RestartSec=20
LimitNOFILE=65536
[Install]
WantedBy=multi-user.target
U
systemctl daemon-reload
printf 'hub route from A through the VPN (expect an HTTP status, not 000): '
curl -s -o /dev/null -m 15 -w '%{http_code}\n' https://api.lsevin.com/symds/hub/ || true
echo "client installed (not started). Next: a-02-start-node-a.sh"
