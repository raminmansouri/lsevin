set -u
VER=3.16.17; B=/opt/symds-rehearsal; J=/usr/lib/jvm/java-21-openjdk-amd64
pq() { k3s kubectl -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -Atc \"$2\""; }
start_node() { cd $B/$1/symmetric-server-$VER; nohup env JAVA_HOME=$J PATH=$J/bin:$PATH JAVA_OPTS="-Xmx384m" bin/sym > $B/$1.out 2>&1 & echo $! > $B/$1.pid; }
stop_node() { pkill -f "symmetric-server-$VER/.*$1" 2>/dev/null; kill $(cat $B/$1.pid) 2>/dev/null; sleep 4; }
wait_sync() { sleep ${1:-25}; }

echo "=== T8a auto-number collision, DEFAULT sequences"
pq sym_root "delete from category.category_groups" >/dev/null; wait_sync 12
pq sym_client "insert into category.category_groups(title) values ('from-A')" >/dev/null &
pq sym_root   "insert into category.category_groups(title) values ('from-B')" >/dev/null &
wait; wait_sync 25
echo "  A has: $(pq sym_client "select string_agg(id||'='||title, ' ; ' order by id) from category.category_groups")"
echo "  B has: $(pq sym_root   "select string_agg(id||'='||title, ' ; ' order by id) from category.category_groups")"
echo "  errors: $(pq sym_root "select count(*) from sym_incoming_error")/$(pq sym_client "select count(*) from sym_incoming_error")"

echo "=== T8b same test with ODD (A) / EVEN (B) sequences"
pq sym_root "delete from category.category_groups" >/dev/null; wait_sync 12
pq sym_root   "alter sequence category.category_groups_id_seq increment by 2 restart with 1000002" >/dev/null
pq sym_client "alter sequence category.category_groups_id_seq increment by 2 restart with 1000001" >/dev/null
pq sym_client "insert into category.category_groups(title) values ('from-A')" >/dev/null &
pq sym_root   "insert into category.category_groups(title) values ('from-B')" >/dev/null &
wait; wait_sync 25
echo "  A has: $(pq sym_client "select string_agg(id||'='||title, ' ; ' order by id) from category.category_groups")"
echo "  B has: $(pq sym_root   "select string_agg(id||'='||title, ' ; ' order by id) from category.category_groups")"

echo "=== T5 same row edited on both sides while disconnected - NO conflict rule"
stop_node client
pq sym_client "update support.tags set color='#AAAAAA' where name='rehearsal-A1'" >/dev/null; sleep 2
pq sym_root   "update support.tags set color='#BBBBBB' where name='rehearsal-A1'" >/dev/null   # B edits LAST
start_node client; wait_sync 60
echo "  A color=$(pq sym_client "select color from support.tags where name='rehearsal-A1'")  B color=$(pq sym_root "select color from support.tags where name='rehearsal-A1'")   (B edited last; converged means both #BBBBBB)"

echo "=== T5b same scenario WITH newest-wins conflict rule on support.tags"
pq sym_root "insert into sym_conflict (conflict_id, source_node_group_id, target_node_group_id, detect_type, detect_expression, resolve_type, ping_back, resolve_changes_only, resolve_row_only, target_schema_name, target_table_name, create_time, last_update_time) values ('tags_nw_c2s','client','server','USE_TIMESTAMP','last_modified_date','NEWER_WINS','OFF',0,1,'support','tags',now(),now()),('tags_nw_s2c','server','client','USE_TIMESTAMP','last_modified_date','NEWER_WINS','OFF',0,1,'support','tags',now(),now()) on conflict do nothing" >/dev/null
wait_sync 40
stop_node client
pq sym_root   "update support.tags set color='#CCCCCC' where name='rehearsal-A1'" >/dev/null; sleep 2
pq sym_client "update support.tags set color='#DDDDDD' where name='rehearsal-A1'" >/dev/null   # A edits LAST
start_node client; wait_sync 60
echo "  A color=$(pq sym_client "select color from support.tags where name='rehearsal-A1'")  B color=$(pq sym_root "select color from support.tags where name='rehearsal-A1'")   (A edited last; converged means both #DDDDDD)"

echo "=== T6 outage: hub down while A writes, then hub returns"
stop_node root
for i in 1 2 3; do pq sym_client "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'outage-$i','#000',true,now(),now())" >/dev/null; done
wait_sync 20
echo "  while hub is down: A has $(pq sym_client "select count(*) from support.tags where name like 'outage-%'") rows, pending batches on A=$(pq sym_client "select count(*) from sym_outgoing_batch where status<>'OK'")"
start_node root; wait_sync 75
echo "  after hub returns: B has $(pq sym_root "select count(*) from support.tags where name like 'outage-%'") of 3 rows, pending on A=$(pq sym_client "select count(*) from sym_outgoing_batch where status not in ('OK')")"
