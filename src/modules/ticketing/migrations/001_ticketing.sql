-- Ticketing standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists ticketing;

    create table if not exists ticketing.tickets (
      id uuid primary key default gen_random_uuid(),
      subject_entity_type text,
      subject_entity_id uuid,
      service_provider_id uuid,
      created_by_user_id uuid,
      assigned_to_user_id uuid,
      department text not null default 'support',
      subject text not null,
      status text not null default 'open' check (status in ('open','in_progress','waiting_provider','waiting_lsevin','resolved','closed')),
      priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists ticketing.ticket_messages (
      id uuid primary key default gen_random_uuid(),
      ticket_id uuid not null references ticketing.tickets(id) on delete cascade,
      sender_user_id uuid,
      sender_role text not null check (sender_role in ('provider','staff','lsevin_admin','system')),
      body text not null,
      is_internal_note boolean not null default false,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now()
    );

-- vNext ticket attachments, unread state, and SLA fields.
alter table if exists ticketing.tickets
  add column if not exists unread_for_provider_count int not null default 0,
  add column if not exists unread_for_admin_count int not null default 0,
  add column if not exists first_response_due_at timestamptz,
  add column if not exists resolved_at timestamptz;

alter table if exists ticketing.ticket_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text;

create index if not exists ix_ticketing_tickets_provider_status on ticketing.tickets(service_provider_id, status, updated_at desc);
create index if not exists ix_ticketing_messages_ticket on ticketing.ticket_messages(ticket_id, created_at desc);
