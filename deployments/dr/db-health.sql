-- db-health.sql - READ-ONLY database health and tuning report. Run on A and on B:
--   kubectl -n lsevin exec -i deploy/postgres -- psql -U lsevin -d lsevin -f - < db-health.sql
\pset format unaligned
\pset tuples_only on
\echo === version / size
select version();
select 'database size: ' || pg_size_pretty(pg_database_size(current_database()));
\echo === key settings
select name || ' = ' || setting || coalesce(unit, '') from pg_settings where name in ('shared_buffers','effective_cache_size','work_mem','maintenance_work_mem','max_connections','random_page_cost','effective_io_concurrency','wal_buffers','checkpoint_timeout','max_wal_size','min_wal_size','checkpoint_completion_target','autovacuum_vacuum_scale_factor','autovacuum_analyze_scale_factor','autovacuum_max_workers','autovacuum_vacuum_cost_limit','default_statistics_target','jit','track_io_timing','synchronous_commit','max_worker_processes','max_parallel_workers_per_gather','huge_pages','idle_in_transaction_session_timeout','statement_timeout','log_min_duration_statement') order by 1;
select 'extension: ' || extname || ' ' || extversion from pg_extension order by 1;
\echo === cache hit ratios (should be above 99 percent)
select 'buffer cache hit %: ' || round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2) from pg_stat_database where datname = current_database();
select 'index hit %: ' || round(100.0 * sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) from pg_statio_user_indexes;
\echo === connections
select 'connections: ' || count(*) || ' (' || count(*) filter (where state = 'active') || ' active, ' || count(*) filter (where state = 'idle in transaction') || ' idle in transaction)' from pg_stat_activity where datname = current_database();
\echo === checkpoints / temp files
select 'checkpoints timed ' || num_timed || ' requested ' || num_requested || ' (requested should be small)' from pg_stat_checkpointer;
select 'temp files: ' || temp_files || ' (' || pg_size_pretty(temp_bytes) || ') deadlocks ' || deadlocks || ' conflicts ' || conflicts from pg_stat_database where datname = current_database();
\echo === largest tables (data + indexes)
select pg_size_pretty(pg_total_relation_size(c.oid)) || '  ' || n.nspname || '.' || c.relname || '  rows~' || c.reltuples::bigint from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and n.nspname not in ('pg_catalog', 'information_schema') order by pg_total_relation_size(c.oid) desc limit 12;
\echo === dead tuples / vacuum lag (tables with more than 5 percent dead rows)
select n_dead_tup || ' dead of ' || (n_live_tup + n_dead_tup) || '  ' || schemaname || '.' || relname || '  last autovacuum ' || coalesce(last_autovacuum::text, 'never') from pg_stat_user_tables where n_dead_tup > 1000 and n_dead_tup > 0.05 * (n_live_tup + n_dead_tup) order by n_dead_tup desc limit 10;
\echo === sequential scans on big tables (index candidates)
select seq_scan || ' seq scans, ' || seq_tup_read || ' rows read  ' || schemaname || '.' || relname || '  (' || n_live_tup || ' rows, idx scans ' || coalesce(idx_scan, 0) || ')' from pg_stat_user_tables where n_live_tup > 5000 and seq_scan > 500 order by seq_tup_read desc limit 10;
\echo === unused indexes bigger than 1 MB (never scanned since stats reset; excluding unique/primary)
select pg_size_pretty(pg_relation_size(i.indexrelid)) || '  ' || i.schemaname || '.' || i.relname || '.' || i.indexrelname from pg_stat_user_indexes i join pg_index x on x.indexrelid = i.indexrelid where i.idx_scan = 0 and not x.indisunique and not x.indisprimary and pg_relation_size(i.indexrelid) > 1048576 order by pg_relation_size(i.indexrelid) desc limit 12;
\echo === foreign keys without a supporting index (slow deletes/joins)
select count(*) || ' foreign keys have no index on the referencing column(s)' from pg_constraint c where c.contype = 'f' and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and (i.indkey::int2[])[0:array_length(c.conkey,1)-1] = c.conkey);
\echo === slowest statements (pg_stat_statements, if enabled)
select round(total_exec_time::numeric / 1000, 1) || ' s total, ' || calls || ' calls, mean ' || round(mean_exec_time::numeric, 1) || ' ms  ' || left(regexp_replace(query, '\s+', ' ', 'g'), 110) from pg_stat_statements where dbid = (select oid from pg_database where datname = current_database()) order by total_exec_time desc limit 10;
\echo === SymmetricDS tables size
select pg_size_pretty(sum(pg_total_relation_size(c.oid))) || ' in sym_* tables' from pg_class c where c.relname like 'sym\_%' and c.relkind = 'r';
select 'sym_data rows: ' || count(*) || ', oldest ' || coalesce(min(create_time)::text, '-') from sym_data;
