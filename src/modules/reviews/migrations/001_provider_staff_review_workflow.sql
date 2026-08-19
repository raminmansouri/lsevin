-- Provider/staff review workflow. Additive and compatible with existing category review tables.
create schema if not exists provider_reviews;

alter table if exists category.service_provider_comment_replies
  drop constraint if exists ck_service_provider_comment_replies_author_role;
alter table if exists category.service_provider_comment_replies
  add constraint ck_service_provider_comment_replies_author_role
  check (author_role in ('admin','customer','provider','staff'));

-- Normalize the latest legacy provider reply created by the older portal implementation.
with legacy_provider_replies as (
  select id, row_number() over (partition by review_id order by create_date desc, id desc) as rn
  from category.service_provider_comment_replies
  where author_role = 'admin' and created_by_admin = false
)
update category.service_provider_comment_replies r
set author_role = 'provider', last_modified_date = now()
from legacy_provider_replies l
where r.id = l.id and l.rn = 1;

alter table category.service_provider_comment_replies
  add column if not exists reviewed_by_user_id uuid,
  add column if not exists reviewed_at timestamptz;

create table if not exists provider_reviews.response_policies (
  service_provider_id uuid primary key,
  allow_staff_responses boolean not null default false,
  provider_reply_requires_moderation boolean not null default true,
  staff_reply_requires_moderation boolean not null default true,
  updated_by_user_id uuid,
  updated_at timestamptz not null default now()
);

create table if not exists provider_reviews.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null,
  service_provider_id uuid not null,
  staff_id uuid,
  reported_by_user_id uuid not null,
  reporter_role text not null check (reporter_role in ('provider','staff')),
  reason_category text not null check (reason_category in ('spam','abuse','privacy','factual','other')),
  note text,
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed','actioned')),
  reviewed_by_user_id uuid,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_provider_reviews_active_official_reply
  on category.service_provider_comment_replies(review_id)
  where parent_reply_id is null
    and author_role in ('provider','staff')
    and created_by_admin = false
    and moderation_status in ('pending','approved');
create unique index if not exists ux_provider_reviews_reporter_pending
  on provider_reviews.review_reports(review_id, reported_by_user_id)
  where status in ('pending','reviewed');
create index if not exists ix_provider_reviews_reports_provider_status
  on provider_reviews.review_reports(service_provider_id, status, created_at desc);
