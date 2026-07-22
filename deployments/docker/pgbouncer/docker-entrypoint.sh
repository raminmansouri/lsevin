#!/usr/bin/env sh
set -eu

required_vars="PGBOUNCER_ADMIN_USER PGBOUNCER_ADMIN_PASSWORD PGBOUNCER_MONITOR_USER PGBOUNCER_MONITOR_PASSWORD"
for name in $required_vars; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    echo "ERROR: $name is required" >&2
    exit 1
  fi
done

escape_userlist() {
  # PgBouncer's auth_file uses quoted strings. Escape backslashes first,
  # followed by double quotes.
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

admin_user="$(escape_userlist "$PGBOUNCER_ADMIN_USER")"
admin_password="$(escape_userlist "$PGBOUNCER_ADMIN_PASSWORD")"
monitor_user="$(escape_userlist "$PGBOUNCER_MONITOR_USER")"
monitor_password="$(escape_userlist "$PGBOUNCER_MONITOR_PASSWORD")"

{
  printf '"%s" "%s"\n' "$admin_user" "$admin_password"
  if [ "$PGBOUNCER_MONITOR_USER" != "$PGBOUNCER_ADMIN_USER" ]; then
    printf '"%s" "%s"\n' "$monitor_user" "$monitor_password"
  fi
} > /tmp/userlist.txt
chmod 0600 /tmp/userlist.txt

sed \
  -e "s/__ADMIN_USER__/$admin_user/g" \
  -e "s/__STATS_USER__/$monitor_user/g" \
  -e "s/__MAX_CLIENT_CONN__/${PGBOUNCER_MAX_CLIENT_CONN:-1000}/g" \
  -e "s/__DEFAULT_POOL_SIZE__/${PGBOUNCER_DEFAULT_POOL_SIZE:-50}/g" \
  -e "s/__MIN_POOL_SIZE__/${PGBOUNCER_MIN_POOL_SIZE:-5}/g" \
  -e "s/__RESERVE_POOL_SIZE__/${PGBOUNCER_RESERVE_POOL_SIZE:-10}/g" \
  -e "s/__MAX_DB_CONNECTIONS__/${PGBOUNCER_MAX_DB_CONNECTIONS:-90}/g" \
  -e "s/__MAX_USER_CONNECTIONS__/${PGBOUNCER_MAX_USER_CONNECTIONS:-90}/g" \
  -e "s/__MAX_PREPARED_STATEMENTS__/${PGBOUNCER_MAX_PREPARED_STATEMENTS:-200}/g" \
  /etc/pgbouncer/pgbouncer.ini.template > /tmp/pgbouncer.ini

exec /usr/local/bin/pgbouncer /tmp/pgbouncer.ini
