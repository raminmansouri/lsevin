-- Reviews standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists reviews;

    create table if not exists reviews.reviews (
      id uuid primary key default gen_random_uuid(),
      target_type text not null check (target_type in ('provider','service','staff')),
      target_id uuid not null,
      service_provider_id uuid,
      customer_id uuid,
      customer_name text not null,
      rating int check (rating between 1 and 5),
      body text not null,
      locale text not null default 'fa-IR',
      status text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
      is_verified boolean not null default false,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists reviews.review_replies (
      id uuid primary key default gen_random_uuid(),
      review_id uuid not null references reviews.reviews(id) on delete cascade,
      author_entity_type text not null check (author_entity_type in ('provider','staff','lsevin_admin')),
      author_entity_id uuid,
      body text not null,
      status text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
      created_by_user_id uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

-- vNext review reply moderation and reputation metrics.
alter table if exists reviews.review_replies
  add column if not exists reviewed_by_user_id uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists decision_reason text;

create index if not exists ix_reviews_target_provider on reviews.reviews(service_provider_id, target_type, target_id, created_at desc);
create index if not exists ix_review_replies_status on reviews.review_replies(status, created_at desc);
