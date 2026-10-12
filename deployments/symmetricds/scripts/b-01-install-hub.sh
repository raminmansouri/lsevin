#!/usr/bin/env bash
# Run ON SERVER B as root (sudo). Installs the SymmetricDS hub. Does NOT start it and changes no data.
# Creates: Java 21, /opt/symds/hub, DB role "symds" (dedicated superuser, random password kept only in the
# root-only engine file), systemd unit symds-hub.
set -euo pipefail
VER=3.16.17; BASE=/opt/symds; HUB=$BASE/hub
SHA=3b1f9dbe4aea1e2e021446aceed82d1be592b0cd3b62414d8e33b5a26047f073
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -q openjdk-21-jre-headless unzip >/dev/null
mkdir -p $BASE; cd $BASE
[ -f symmetric-server-$VER.zip ] || curl -s -L -m 280 -o symmetric-server-$VER.zip "https://sourceforge.net/projects/symmetricds/files/symmetricds/symmetricds-3.16/symmetric-server-$VER.zip/download"
[ "$(sha256sum symmetric-server-$VER.zip | cut -c1-64)" = "$SHA" ] || { echo "checksum mismatch"; exit 1; }
id symds >/dev/null 2>&1 || useradd --system --home $BASE --shell /usr/sbin/nologin symds
rm -rf $HUB; mkdir -p $HUB; unzip -q symmetric-server-$VER.zip -d $HUB; mv $HUB/symmetric-server-$VER/* $HUB/; rmdir $HUB/symmetric-server-$VER; chmod +x $HUB/bin/*
PW=$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 28)
kubectl -n lsevin exec -i deploy/postgres -- sh -c 'psql -U "$POSTGRES_USER" -d postgres -q' <<SQL
do \$\$ begin
  if not exists (select 1 from pg_roles where rolname='symds') then create role symds login superuser password '$PW';
  else alter role symds password '$PW'; end if;
end \$\$;
SQL
IP=$(kubectl -n lsevin get svc postgres -o jsonpath='{.spec.clusterIP}')
cat > $HUB/engines/hub.properties <<P
engine.name=hub
group.id=server
external.id=000
db.driver=org.postgresql.Driver
db.url=jdbc:postgresql://$IP:5432/lsevin
db.user=symds
db.password=$PW
db.init.sql=set session_replication_role = replica
registration.url=
sync.url=https://api.lsevin.com/symds/hub
auto.registration=false
auto.reload=false
job.routing.period.time.ms=2000
P
sed -i "s/^http.port=.*/http.port=31415/; s/^host.bind.name=.*/host.bind.name=172.18.0.1/; s/^https.enable=.*/https.enable=false/" $HUB/conf/symmetric-server.properties
chown -R symds:symds $BASE; chmod 700 $BASE; chmod 600 $HUB/engines/hub.properties
cat > /etc/systemd/system/symds-hub.service <<U
[Unit]
Description=SymmetricDS hub (A <-> B sync; B is only contacted)
After=network-online.target k3s.service
Wants=network-online.target
[Service]
User=symds
WorkingDirectory=$HUB
Environment=JAVA_OPTS=-Xms64m -Xmx512m
ExecStart=$HUB/bin/sym
Restart=on-failure
RestartSec=15
LimitNOFILE=65536
[Install]
WantedBy=multi-user.target
U
systemctl daemon-reload
echo "hub installed (not started). Next: b-02-caddy-route.sh"
