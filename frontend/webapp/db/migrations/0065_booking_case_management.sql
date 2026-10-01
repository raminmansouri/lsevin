-- ---------------------------------------------------------------------------
-- 0065 — Reusable service-process templates and per-booking care journeys.
--
-- category.service_process is retained as the provider-service-specific legacy
-- source. New templates can be attached to a category, service definition, or
-- provider service. A booking receives a snapshot so later template edits do
-- not rewrite a customer's active or historical journey.
-- ---------------------------------------------------------------------------
begin;

create schema if not exists case_management;

create table if not exists case_management.process_templates (
  id uuid primary key default public.uuid_generate_v4(),
  name_translations jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  scope_type text not null,
  category_id uuid null references category.categories(id) on delete cascade,
  service_definition_id uuid null references category.service_definitions(id) on delete cascade,
  provider_service_id uuid null references category.provider_services(id) on delete cascade,
  is_active boolean not null default true,
  version integer not null default 1,
  created_by uuid null,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ck_process_templates_scope check (
    (scope_type = 'category' and category_id is not null and service_definition_id is null and provider_service_id is null)
    or (scope_type = 'service_definition' and category_id is null and service_definition_id is not null and provider_service_id is null)
    or (scope_type = 'provider_service' and category_id is null and service_definition_id is null and provider_service_id is not null)
  ),
  constraint ck_process_templates_version check (version > 0)
);

create unique index if not exists ux_process_templates_active_category
  on case_management.process_templates(category_id)
  where scope_type = 'category' and is_active;
create unique index if not exists ux_process_templates_active_definition
  on case_management.process_templates(service_definition_id)
  where scope_type = 'service_definition' and is_active;
create unique index if not exists ux_process_templates_active_provider_service
  on case_management.process_templates(provider_service_id)
  where scope_type = 'provider_service' and is_active;

create table if not exists case_management.process_template_steps (
  id uuid primary key default public.uuid_generate_v4(),
  template_id uuid not null references case_management.process_templates(id) on delete cascade,
  step_key text not null,
  display_order integer not null,
  title_translations jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  timing_anchor text not null default 'appointment_start',
  offset_minutes integer not null default 0,
  estimated_duration_minutes integer null,
  responsible_role text not null default 'provider',
  customer_visible boolean not null default true,
  provider_visible boolean not null default true,
  admin_visible boolean not null default true,
  requires_manual_completion boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ux_process_template_steps_key unique(template_id, step_key),
  constraint ux_process_template_steps_order unique(template_id, display_order),
  constraint ck_process_template_steps_anchor check (timing_anchor in ('booking_created', 'appointment_start', 'appointment_end', 'previous_step')),
  constraint ck_process_template_steps_role check (responsible_role in ('customer', 'provider', 'staff', 'admin', 'system')),
  constraint ck_process_template_steps_duration check (estimated_duration_minutes is null or estimated_duration_minutes >= 0)
);

create table if not exists case_management.cases (
  id uuid primary key default public.uuid_generate_v4(),
  booking_id uuid not null references booking.bookings(id) on delete cascade,
  template_id uuid null references case_management.process_templates(id) on delete set null,
  template_version integer null,
  customer_user_id uuid null,
  provider_id uuid not null,
  provider_service_id uuid not null,
  service_definition_id uuid null,
  category_id uuid null,
  specialist_id uuid null,
  assigned_staff_id uuid null,
  status text not null default 'scheduled',
  current_step_id uuid null,
  started_at timestamptz null,
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  lock_version integer not null default 1,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ux_cases_booking unique(booking_id),
  constraint ck_cases_status check (status in ('scheduled', 'active', 'on_hold', 'completed', 'cancelled')),
  constraint ck_cases_lock_version check (lock_version > 0)
);

create table if not exists case_management.case_steps (
  id uuid primary key default public.uuid_generate_v4(),
  case_id uuid not null references case_management.cases(id) on delete cascade,
  template_step_id uuid null references case_management.process_template_steps(id) on delete set null,
  step_key text not null,
  display_order integer not null,
  title_translations jsonb not null default '{}'::jsonb,
  description_translations jsonb not null default '{}'::jsonb,
  legacy_title text null,
  legacy_description text null,
  status text not null default 'pending',
  responsible_role text not null default 'provider',
  assigned_user_id uuid null,
  customer_visible boolean not null default true,
  provider_visible boolean not null default true,
  admin_visible boolean not null default true,
  planned_start_at timestamptz null,
  planned_end_at timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  completed_by uuid null,
  completion_note text null,
  metadata jsonb not null default '{}'::jsonb,
  lock_version integer not null default 1,
  create_date timestamptz not null default now(),
  last_modified_date timestamptz not null default now(),
  constraint ux_case_steps_key unique(case_id, step_key),
  constraint ux_case_steps_order unique(case_id, display_order),
  constraint ck_case_steps_status check (status in ('pending', 'ready', 'in_progress', 'completed', 'skipped', 'blocked', 'cancelled')),
  constraint ck_case_steps_role check (responsible_role in ('customer', 'provider', 'staff', 'admin', 'system')),
  constraint ck_case_steps_lock_version check (lock_version > 0)
);

alter table case_management.cases
  drop constraint if exists fk_cases_current_step;
alter table case_management.cases
  add constraint fk_cases_current_step foreign key(current_step_id)
  references case_management.case_steps(id) on delete set null deferrable initially deferred;

create table if not exists case_management.case_events (
  id uuid primary key default public.uuid_generate_v4(),
  case_id uuid not null references case_management.cases(id) on delete cascade,
  case_step_id uuid null references case_management.case_steps(id) on delete set null,
  event_type text not null,
  actor_user_id uuid null,
  actor_role text null,
  from_status text null,
  to_status text null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  create_date timestamptz not null default now(),
  constraint ck_case_events_actor_role check (actor_role is null or actor_role in ('customer', 'provider', 'staff', 'admin', 'system'))
);

create index if not exists ix_cases_customer on case_management.cases(customer_user_id, create_date desc);
create index if not exists ix_cases_provider on case_management.cases(provider_id, status, create_date desc);
create index if not exists ix_cases_staff on case_management.cases(assigned_staff_id, status, create_date desc);
create index if not exists ix_case_steps_case_status on case_management.case_steps(case_id, status, display_order);
create index if not exists ix_case_steps_planned_start on case_management.case_steps(planned_start_at) where status in ('pending', 'ready');
create index if not exists ix_case_events_case on case_management.case_events(case_id, create_date desc);

create or replace function case_management.ensure_case_for_booking(p_booking_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_booking booking.bookings%rowtype;
  v_definition_id uuid;
  v_category_id uuid;
  v_template_id uuid;
  v_template_version integer;
  v_case_id uuid;
  v_created boolean := false;
  v_appointment_start timestamptz;
begin
  select * into v_booking from booking.bookings where id = p_booking_id;
  if not found then
    raise exception 'booking_not_found';
  end if;

  if lower(coalesce(v_booking.booking_status, '')) in ('cancelled', 'canceled', 'rejected', 'failed', 'no_show') then
    select id into v_case_id from case_management.cases where booking_id = p_booking_id;
    return v_case_id;
  end if;

  select ps.service_definition_id, sd.category_id
    into v_definition_id, v_category_id
  from category.provider_services ps
  join category.service_definitions sd on sd.id = ps.service_definition_id
  where ps.id = v_booking.service_id;

  with recursive category_chain as (
    select c.id, c.parent_id, 0 as depth from category.categories c where c.id = v_category_id
    union all
    select parent.id, parent.parent_id, child.depth + 1
    from category.categories parent
    join category_chain child on child.parent_id = parent.id
  ), candidates as (
    select pt.id, pt.version,
      case pt.scope_type
        when 'provider_service' then 3000
        when 'service_definition' then 2000
        else 1000 - coalesce(cc.depth, 0)
      end as priority
    from case_management.process_templates pt
    left join category_chain cc on pt.scope_type = 'category' and cc.id = pt.category_id
    where pt.is_active
      and ((pt.scope_type = 'provider_service' and pt.provider_service_id = v_booking.service_id)
        or (pt.scope_type = 'service_definition' and pt.service_definition_id = v_definition_id)
        or (pt.scope_type = 'category' and cc.id is not null))
  )
  select id, version into v_template_id, v_template_version
  from candidates order by priority desc limit 1;

  insert into case_management.cases (
    booking_id, template_id, template_version, customer_user_id, provider_id,
    provider_service_id, service_definition_id, category_id, specialist_id
  ) values (
    v_booking.id, v_template_id, v_template_version, v_booking.user_id, v_booking.provider_id,
    v_booking.service_id, v_definition_id, v_category_id, v_booking.specialist_id
  )
  on conflict (booking_id) do nothing
  returning id into v_case_id;

  if v_case_id is not null then
    v_created := true;
  else
    select id into v_case_id from case_management.cases where booking_id = p_booking_id;
  end if;

  if not v_created then return v_case_id; end if;

  if v_booking.selected_date is not null then
    v_appointment_start := (v_booking.selected_date + coalesce(v_booking.selected_time_from, v_booking.selected_time, time '00:00')) at time zone 'Asia/Tehran';
  end if;

  if v_template_id is not null then
    insert into case_management.case_steps (
      case_id, template_step_id, step_key, display_order,
      title_translations, description_translations, responsible_role,
      customer_visible, provider_visible, admin_visible,
      planned_start_at, planned_end_at, metadata
    )
    select v_case_id, s.id, s.step_key, s.display_order,
      s.title_translations, s.description_translations, s.responsible_role,
      s.customer_visible, s.provider_visible, s.admin_visible,
      case s.timing_anchor
        when 'booking_created' then v_booking.create_date + make_interval(mins => s.offset_minutes)
        when 'appointment_start' then v_appointment_start + make_interval(mins => s.offset_minutes)
        when 'appointment_end' then v_appointment_start + make_interval(mins => coalesce(sd.duration_minutes, 0) + s.offset_minutes)
        else null
      end,
      case when s.estimated_duration_minutes is null then null else
        (case s.timing_anchor
          when 'booking_created' then v_booking.create_date + make_interval(mins => s.offset_minutes)
          when 'appointment_start' then v_appointment_start + make_interval(mins => s.offset_minutes)
          when 'appointment_end' then v_appointment_start + make_interval(mins => coalesce(sd.duration_minutes, 0) + s.offset_minutes)
          else null
        end) + make_interval(mins => s.estimated_duration_minutes)
      end,
      s.metadata
    from case_management.process_template_steps s
    left join category.service_definitions sd on sd.id = v_definition_id
    where s.template_id = v_template_id
    order by s.display_order;
  else
    insert into case_management.case_steps (
      case_id, step_key, display_order, legacy_title, legacy_description,
      responsible_role, customer_visible, provider_visible, admin_visible,
      metadata
    )
    select v_case_id, 'legacy-' || sp.id::text, sp.step, sp.title, sp.description,
      'provider', true, true, true,
      jsonb_build_object('legacyDuration', sp.duration)
    from category.service_process sp
    where sp.service_id = v_booking.service_id
    order by sp.step, sp.id;
  end if;

  update case_management.cases c
  set current_step_id = (
    select cs.id from case_management.case_steps cs
    where cs.case_id = c.id order by cs.display_order limit 1
  )
  where c.id = v_case_id;

  insert into case_management.case_events(case_id, event_type, actor_role, to_status)
  values(v_case_id, 'case.created', 'system', 'scheduled');

  return v_case_id;
end;
$$;

create or replace function case_management.create_case_after_booking()
returns trigger
language plpgsql
as $$
begin
  if lower(coalesce(new.booking_status, '')) not in ('cancelled', 'canceled', 'rejected', 'failed', 'no_show') then
    perform case_management.ensure_case_for_booking(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_create_case on booking.bookings;
create trigger trg_booking_create_case
after insert or update of booking_status on booking.bookings
for each row execute function case_management.create_case_after_booking();

comment on schema case_management is 'Versioned service-process templates and immutable booking case timelines.';
comment on table case_management.cases is 'One care/service journey per booking; access is enforced by customer, provider/staff, and admin application guards.';

commit;
