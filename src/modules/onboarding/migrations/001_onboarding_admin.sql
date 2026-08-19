create table if not exists provider_portal.onboarding_application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references provider_portal.onboarding_applications(id) on delete cascade,
  reviewer_user_id uuid,
  action text not null,
  previous_status text,
  new_status text,
  reason text,
  note text,
  service_provider_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ck_onboarding_application_reviews_action check (
    action in ('opened','approved_created','approved_attached','rejected','changes_requested','reopened','disabled')
  )
);

create index if not exists ix_onboarding_application_reviews_application
  on provider_portal.onboarding_application_reviews(application_id, created_at desc);

create index if not exists ix_onboarding_application_reviews_reviewer
  on provider_portal.onboarding_application_reviews(reviewer_user_id, created_at desc);
