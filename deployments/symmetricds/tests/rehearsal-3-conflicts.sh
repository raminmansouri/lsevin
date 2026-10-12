set -u
VER=3.16.17; B=/opt/symds-rehearsal; J=/usr/lib/jvm/java-21-openjdk-amd64
pq() { k3s kubectl -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -Atc \"$2\""; }
start_node() { cd $B/$1/symmetric-server-$VER; nohup env JAVA_HOME=$J PATH=$J/bin:$PATH JAVA_OPTS="-Xmx384m" bin/sym > $B/$1.out 2>&1 & echo $! > $B/$1.pid; }
stop_node() { kill $(cat $B/$1.pid) 2>/dev/null; sleep 5; }
settle() { # poll until both colors are equal and stable, max 150s
  local t=0 a b; while [ $t -lt 150 ]; do a=$(pq sym_client "select color from support.tags where name='rehearsal-A1'"); b=$(pq sym_root "select color from support.tags where name='rehearsal-A1'"); [ "$a" = "$b" ] && { sleep 6; a2=$(pq sym_client "select color from support.tags where name='rehearsal-A1'"); [ "$a" = "$a2" ] && { echo "  converged to $a after ${t}s"; return; }; }; sleep 5; t=$((t+5)); done; echo "  NOT CONVERGED after 150s: A=$a B=$b"; }
scenario() { # first_side_value second_side_value  (client edited FIRST? -> arg1 = who edits last)
  stop_node client
  if [ "$1" = "A_LAST" ]; then pq sym_root "update support.tags set color='#222222' where name='rehearsal-A1'" >/dev/null; sleep 2; pq sym_client "update support.tags set color='#111111' where name='rehearsal-A1'" >/dev/null; echo "  edits: B=#222222 (first), A=#111111 (LAST)"
  else pq sym_client "update support.tags set color='#333333' where name='rehearsal-A1'" >/dev/null; sleep 2; pq sym_root "update support.tags set color='#444444' where name='rehearsal-A1'" >/dev/null; echo "  edits: A=#333333 (first), B=#444444 (LAST)"; fi
  start_node client; settle
}
echo "=== no conflict rule (remove it)"
pq sym_root "delete from sym_conflict" >/dev/null; sleep 40
scenario A_LAST
scenario B_LAST
echo "=== newest-wins rule on support.tags"
pq sym_root "insert into sym_conflict (conflict_id, source_node_group_id, target_node_group_id, detect_type, detect_expression, resolve_type, ping_back, resolve_changes_only, resolve_row_only, target_schema_name, target_table_name, create_time, last_update_time) values ('tags_nw_c2s','client','server','USE_TIMESTAMP','last_modified_date','NEWER_WINS','OFF',0,1,'support','tags',now(),now()),('tags_nw_s2c','server','client','USE_TIMESTAMP','last_modified_date','NEWER_WINS','OFF',0,1,'support','tags',now(),now())" >/dev/null; sleep 45
scenario A_LAST
scenario B_LAST
