#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/deployments/docker"

cd "$ROOT_DIR"

for script in scripts/*.sh; do
  bash -n "$script" || fail "shell syntax failed: $script"
done

python3 - "$ROOT_DIR" "$DOCKER_DIR" <<'PY'
from pathlib import Path
import sys
import yaml

roots = [Path(sys.argv[1]), Path(sys.argv[2])]
for root in roots:
    for path in root.rglob("*.yml"):
        if "inventory/production" in str(path):
            continue
        try:
            yaml.safe_load(path.read_text())
        except Exception as exc:
            raise SystemExit(f"ERROR: YAML parsing failed for {path}: {exc}")
print("YAML parsing passed.")
PY

# Docker Go-template expressions such as {{.State.Status}} are valid in shell
# scripts, but they are invalid when embedded in Ansible YAML or Jinja templates.
if grep -RInF '{{.' \
  "$ROOT_DIR/roles" \
  "$ROOT_DIR/playbooks" \
  --include='*.yml' \
  --include='*.yaml' \
  --include='*.j2'
then
  fail "unescaped Docker Go-template syntax was found in an Ansible-rendered file"
fi

for playbook in \
  playbooks/provision.yml \
  playbooks/database.yml \
  playbooks/verify.yml \
  playbooks/site.yml
do
  ansible-playbook --syntax-check "$playbook"
done

[[ -f "$DOCKER_DIR/pgbouncer/Dockerfile" ]] \
  || fail "PgBouncer Dockerfile is missing"
grep -q 'pandoc-cli' "$DOCKER_DIR/pgbouncer/Dockerfile" \
  || fail "PgBouncer Dockerfile is missing pandoc-cli"
if grep -q -- '--with-libevent' "$DOCKER_DIR/pgbouncer/Dockerfile"; then
  fail "PgBouncer Dockerfile contains unsupported --with-libevent option"
fi



PGBACKREST_TEMPLATE="$ROOT_DIR/roles/lsevin_database/templates/pgbackrest.conf.j2"
POSTGRES_TEMPLATE="$ROOT_DIR/roles/lsevin_database/templates/postgresql.conf.j2"
DATABASE_TASKS="$ROOT_DIR/roles/lsevin_database/tasks/main.yml"

if grep -Eq '^repo[0-9]+-compress-(type|level)=' "$PGBACKREST_TEMPLATE"; then
  fail "pgBackRest compression options must be compress-type/compress-level, not repoN-compress-*"
fi
grep -q '^compress-type=zst$' "$PGBACKREST_TEMPLATE" \
  || fail "pgBackRest template is missing compress-type=zst"
grep -q '^compress-level=3$' "$PGBACKREST_TEMPLATE" \
  || fail "pgBackRest template is missing compress-level=3"
grep -q "archive-push %p || exit 1" "$POSTGRES_TEMPLATE" \
  || fail "PostgreSQL archive_command does not normalize pgBackRest failures"
grep -q 'Initialize pgBackRest repository before logical backup' "$DATABASE_TASKS" \
  || fail "database role does not initialize pgBackRest before logical backup"
grep -q 'Verify pgBackRest archiving before logical backup' "$DATABASE_TASKS" \
  || fail "database role does not verify pgBackRest before logical backup"

printf '%s\n' 'Ansible, YAML, shell, Jinja, PgBouncer, and pgBackRest static validation passed.'
