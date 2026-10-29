import { writeFileSync } from "node:fs";
import postgres from "postgres";

// Explicit opt-in; never load production credentials implicitly from .env files.
if (!process.env.PERFORMANCE_DATABASE_URL)
  throw new Error(
    "Set PERFORMANCE_DATABASE_URL to a database authorized for read-only diagnostics."
  );
const sql = postgres(process.env.PERFORMANCE_DATABASE_URL, {
  max: 1,
  prepare: false,
  connect_timeout: 5,
  idle_timeout: 1,
});
const report = { measuredAt: new Date().toISOString(), readOnly: true };
try {
  await sql.begin("read only", async (tx) => {
    await tx`set local statement_timeout = '15s'`;
    report.version =
      await tx`select current_setting('server_version') as postgres_version`;
    report.tables =
      await tx`select schemaname,relname,n_live_tup,n_dead_tup,seq_scan,idx_scan,last_analyze,last_autoanalyze from pg_stat_user_tables where schemaname in ('category','booking','booking_pro','customer') order by schemaname,relname`;
    report.indexes =
      await tx`select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname in ('category','booking','booking_pro') order by schemaname,tablename,indexname`;
    // Representative catalog access paths. No customer rows, identifiers, query
    // text from pg_stat_statements or bind values are exported.
    report.providerListingPlan =
      await tx`explain (analyze,buffers,format json) select id from category.service_providers where is_active = true order by coalesce(featured_score,0) desc,coalesce(rating,0) desc,create_date desc limit 30`;
    report.serviceListingPlan =
      await tx`explain (analyze,buffers,format json) select ps.id from category.provider_services ps join category.service_providers sp on sp.id=ps.service_provider_id and sp.is_active=true where ps.is_active=true order by ps.is_popular desc nulls last,ps.trending_score desc nulls last,ps.create_date desc limit 30`;
    report.staffListingPlan =
      await tx`explain (analyze,buffers,format json) select s.id from category.staff s where s.is_active=true and exists(select 1 from category.provider_staffs psf join category.service_providers sp on sp.id=psf.service_provider_id and sp.is_active=true where psf.staff_id=s.id and psf.is_active=true) order by s.rating desc nulls last,s.review_count desc nulls last,s.create_date desc limit 30`;
    const registry =
      await tx`select to_regclass('public.schema_migrations') as name`;
    if (registry[0]?.name)
      report.migrations =
        await tx`select name,checksum,applied_at from public.schema_migrations order by name`;
  });
  const output = process.argv[2];
  if (output) writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  else console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // Connection messages can contain credentials/hosts; expose only the code.
  console.error(
    JSON.stringify({ status: "FAIL", code: error.code || error.name })
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
