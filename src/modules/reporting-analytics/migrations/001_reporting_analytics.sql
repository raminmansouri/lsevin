-- Reporting & Analytics standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists reporting_analytics;

    create table if not exists reporting_analytics.report_snapshots (
      id uuid primary key default gen_random_uuid(),
      scope_type text not null check (scope_type in ('global','provider','staff','service')),
      scope_id uuid,
      report_key text not null,
      period_start date,
      period_end date,
      metrics jsonb not null default '{}',
      created_by_user_id uuid,
      created_at timestamptz not null default now()
    );
    create table if not exists reporting_analytics.export_jobs (
      id uuid primary key default gen_random_uuid(),
      report_snapshot_id uuid references reporting_analytics.report_snapshots(id),
      export_format text not null check (export_format in ('xlsx','csv','pdf')),
      status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
      file_url text,
      error_message text,
      created_at timestamptz not null default now(),
      completed_at timestamptz
    );

-- vNext provider/admin analytics snapshots.
create table if not exists reporting_analytics.profile_events (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('provider','staff','service')),
  scope_id uuid not null,
  event_name text not null,
  locale text,
  source_path text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ix_reporting_profile_events_scope on reporting_analytics.profile_events(scope_type, scope_id, created_at desc);
create index if not exists ix_reporting_snapshots_scope on reporting_analytics.report_snapshots(scope_type, scope_id, report_key, created_at desc);
