#!/bin/bash
# LSevin incident-agent installer. Run as root from a checkout of this folder.
#   Server A (Iran):   sudo bash install.sh a
#   Server B (Turkey): sudo bash install.sh b --a-pubkey-file /root/a-agent.pub [--a-exit-ip 141.95.51.57]
# Order: A first (it prints the public key B needs), then B. Nothing is switched on until you touch /etc/lsevin-agent/ENABLED (see README.md).
# Idempotent: safe to re-run (it never overwrites /etc/lsevin-agent/agent.env, so your API key stays).
set -euo pipefail
SITE=${1:-}; shift || true
A_PUB=""; A_EXIT_IP="141.95.51.57"; B_IP=""; B_HOST="202.133.90.50"
while [ $# -gt 0 ]; do case "$1" in
  --a-pubkey-file) A_PUB=$2; shift 2;; --a-exit-ip) A_EXIT_IP=$2; shift 2;; --b-ip) B_IP=$2; shift 2;; --b-host) B_HOST=$2; shift 2;;
  *) echo "unknown option $1"; exit 2;; esac; done
[ "$SITE" = a ] || [ "$SITE" = b ] || { echo "usage: install.sh a | b [--a-pubkey-file F] [--a-exit-ip IP]"; exit 2; }
[ "$(id -u)" -eq 0 ] || { echo "run as root"; exit 2; }
HERE=$(cd "$(dirname "$0")" && pwd)
ETC=/etc/lsevin-agent; STATE=/var/lib/lsevin-agent; LOGD=/var/log/lsevin-agent

echo "== 1. user, folders"
id lsevin-agent >/dev/null 2>&1 || useradd --system --home-dir "$STATE" --shell /usr/sbin/nologin lsevin-agent
install -d -o lsevin-agent -g lsevin-agent -m 750 "$STATE" "$LOGD"
install -d -o root -g lsevin-agent -m 750 "$ETC"
apt-get install -y -qq curl ca-certificates jq >/dev/null

echo "== 2. programs"
for f in lsevin-agent-ctl lsevin-agent-run; do install -o root -g root -m 755 "$HERE/$f" /usr/local/sbin/$f; done
install -o root -g lsevin-agent -m 640 "$HERE/RUNBOOK.md" "$ETC/RUNBOOK.md"
install -o root -g lsevin-agent -m 640 "$HERE/settings.json" "$ETC/settings.json"
# the log written by the privileged tool must not be writable by the agent
touch "$LOGD/ctl.log"; chown root:lsevin-agent "$LOGD/ctl.log"; chmod 640 "$LOGD/ctl.log"

if [ ! -e "$ETC/agent.env" ]; then
  umask 077
  { echo "# one line per setting; read by lsevin-agent-run. Put the API key on the first line (see README)."
    echo "ANTHROPIC_API_KEY="
    echo "SITE_NAME=$(echo $SITE | tr a-z A-Z)"
    echo "AGENT_MODEL=claude-sonnet-5-5"
    echo "MAX_RUNS_PER_DAY=8"
    echo "AGENT_MAX_TURNS=40"
    echo "AGENT_TIMEOUT_SECONDS=1500"
    [ "$SITE" = a ] && echo "B_HOST=$B_HOST"
    [ "$SITE" = a ] && echo "AGENT_HTTPS_PROXY=http://$B_HOST:3128"
  } > "$ETC/agent.env"
  chown root:lsevin-agent "$ETC/agent.env"; chmod 640 "$ETC/agent.env"
fi

echo "== 3. sudoers (one privileged program: the allow-list)"
tmp=$(mktemp)
if [ "$SITE" = b ]; then rule='lsevin-hub ALL=(root) NOPASSWD: /usr/local/sbin/lsevin-agent-hub-priv state, /usr/local/sbin/lsevin-agent-hub-priv report *'
else rule='# (no hub account on site A)'; fi
sed "s#@HUB_RULE@#$rule#" "$HERE/sudoers-lsevin-agent" > "$tmp"
visudo -cf "$tmp" >/dev/null && install -o root -g root -m 440 "$tmp" /etc/sudoers.d/lsevin-agent && rm -f "$tmp"

echo "== 4. Claude Code (official standalone installer, as the agent user)"
if [ ! -x "$STATE/.local/bin/claude" ]; then
  runuser -u lsevin-agent -- env HOME="$STATE" bash -c 'curl -fsSL https://claude.ai/install.sh | bash' || {
    echo "!! automatic install failed. Copy the binary from the other server: scp B:$STATE/.local/bin/claude -> $STATE/.local/bin/claude (owner lsevin-agent, mode 755)"; }
fi
[ -x "$STATE/.local/bin/claude" ] && runuser -u lsevin-agent -- env HOME="$STATE" "$STATE/.local/bin/claude" --version || true

if [ "$SITE" = a ]; then
  echo "== 5a. site A: watcher (pulls A's critical alerts from B through the VPN route)"
  install -o root -g root -m 755 "$HERE/lsevin-agent-watch" /usr/local/sbin/lsevin-agent-watch
  install -m 644 "$HERE/lsevin-agent-watch.service" "$HERE/lsevin-agent-watch.timer" /etc/systemd/system/
  install -d -o lsevin-agent -g lsevin-agent -m 700 "$STATE/.ssh"
  [ -e "$STATE/.ssh/id_ed25519" ] || runuser -u lsevin-agent -- ssh-keygen -q -t ed25519 -N '' -C "lsevin-agent@siteA" -f "$STATE/.ssh/id_ed25519"
  systemctl daemon-reload; systemctl enable lsevin-agent-watch.timer >/dev/null
  # timer only starts working once ENABLED exists (the script exits immediately otherwise)
  systemctl start lsevin-agent-watch.timer
  echo
  echo "Copy this public key to server B and pass it to 'install.sh b --a-pubkey-file':"
  cat "$STATE/.ssh/id_ed25519.pub"
else
  echo "== 5b. site B: hub for site A, dispatcher for site B alerts, proxy for A's Anthropic traffic"
  [ -n "$A_PUB" ] && [ -r "$A_PUB" ] || { echo "!! --a-pubkey-file is required for B"; exit 2; }
  for f in lsevin-agent-hub lsevin-agent-hub-priv lsevin-agent-dispatch; do install -o root -g root -m 755 "$HERE/$f" /usr/local/sbin/$f; done
  id lsevin-hub >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/lsevin-hub --shell /bin/bash lsevin-hub
  install -d -o lsevin-hub -g lsevin-hub -m 700 /var/lib/lsevin-hub/.ssh
  printf 'command="/usr/local/sbin/lsevin-agent-hub",restrict,from="%s" %s\n' "$A_EXIT_IP" "$(cat "$A_PUB")" > /var/lib/lsevin-hub/.ssh/authorized_keys
  chown lsevin-hub:lsevin-hub /var/lib/lsevin-hub/.ssh/authorized_keys; chmod 600 /var/lib/lsevin-hub/.ssh/authorized_keys
  # the hub account may only run the two hub-priv commands; make sure it has a usable shell for the forced command
  # --- proxy for A
  if [ -z "$B_IP" ]; then B_IP=$(ip -4 -o addr show scope global | awk '{print $4}' | cut -d/ -f1 | head -1); fi
  apt-get install -y -qq tinyproxy >/dev/null
  [ -e /etc/tinyproxy/tinyproxy.conf.orig ] || cp /etc/tinyproxy/tinyproxy.conf /etc/tinyproxy/tinyproxy.conf.orig
  sed "s#@B_IP@#$B_IP#; s#@A_EXIT_IP@#$A_EXIT_IP#" "$HERE/tinyproxy-lsevin-agent.conf" > /etc/tinyproxy/tinyproxy.conf
  install -m 644 "$HERE/tinyproxy-lsevin-agent-allow" /etc/tinyproxy/lsevin-agent-allow
  systemctl enable --now tinyproxy >/dev/null; systemctl restart tinyproxy
  ufw allow from "$A_EXIT_IP" to any port 3128 proto tcp comment 'lsevin agent: A -> Anthropic proxy' >/dev/null
  # --- alerter hook (the repo's lsevin-alerter already contains dispatch_agent; this only switches it on)
  if ! grep -q '^AGENT_DISPATCH=' /etc/lsevin-alerter/telegram.env 2>/dev/null; then
    echo 'AGENT_DISPATCH=/usr/local/sbin/lsevin-agent-dispatch' >> /etc/lsevin-alerter/telegram.env
  fi
  echo "alerter: copy deployments/monitoring/lsevin-alerter to /usr/local/sbin/ (md5 must change) and 'systemctl restart lsevin-alerter' - see README step 6"
fi
echo
echo "installed. NEXT: put the API key into $ETC/agent.env, run the simulation, then 'touch $ETC/ENABLED'. See README.md."
