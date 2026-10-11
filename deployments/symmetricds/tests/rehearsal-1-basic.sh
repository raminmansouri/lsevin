set -u
pq() { k3s kubectl -n lsevin exec deploy/postgres -- sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -Atc \"$2\""; }
wait_for() { # db sql expected timeout label
  local t=0; while [ $t -lt $4 ]; do r=$(pq $1 "$2" | tr -d '\r'); [ "$r" = "$3" ] && { echo "  PASS  $5  (${t}s)"; return 0; }; sleep 2; t=$((t+2)); done; echo "  FAIL  $5  (got '$r', wanted '$3')"; return 1; }
echo "T1 A->B insert"
pq sym_client "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'rehearsal-A1','#aaa',true,now(),now())" >/dev/null
wait_for sym_root "select count(*) from support.tags where name='rehearsal-A1'" 1 60 "row inserted on A appears on B"
echo "T2 B->A insert"
pq sym_root "insert into support.tags (id,name,color,is_active,create_date,last_modified_date) values (gen_random_uuid(),'rehearsal-B1','#bbb',true,now(),now())" >/dev/null
wait_for sym_client "select count(*) from support.tags where name='rehearsal-B1'" 1 60 "row inserted on B appears on A"
echo "T3 update + app trigger must not re-fire on the receiving side"
pq sym_client "update support.tags set color='#111' where name='rehearsal-A1'" >/dev/null
wait_for sym_root "select color from support.tags where name='rehearsal-A1'" '#111' 60 "update on A reaches B"
a=$(pq sym_client "select last_modified_date from support.tags where name='rehearsal-A1'"); b=$(pq sym_root "select last_modified_date from support.tags where name='rehearsal-A1'")
[ "$a" = "$b" ] && echo "  PASS  last_modified_date identical on both ($a) -> receiving side did not re-touch it" || echo "  FAIL  last_modified_date differs: A=$a B=$b (app trigger re-fired on apply)"
echo "T4 delete"
pq sym_root "delete from support.tags where name='rehearsal-B1'" >/dev/null
wait_for sym_client "select count(*) from support.tags where name='rehearsal-B1'" 0 60 "delete on B reaches A"
echo "T7 no echo loop: batches after idle"
n1=$(pq sym_root "select count(*) from sym_data" ); sleep 25; n2=$(pq sym_root "select count(*) from sym_data" )
[ "$n1" = "$n2" ] && echo "  PASS  sym_data stable at $n1 rows while idle" || echo "  INFO  sym_data $n1 -> $n2 (check for echo)"
echo "-- errors/rejected batches:"
pq sym_root "select count(*) from sym_outgoing_batch where status not in ('OK','NE')"
pq sym_client "select count(*) from sym_incoming_batch where status not in ('OK')"
pq sym_root "select count(*) from sym_incoming_error"; pq sym_client "select count(*) from sym_incoming_error"
