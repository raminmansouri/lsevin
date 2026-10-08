-- Meal plans for accommodation rooms.
--
-- A room (category.provider_services row) is priced per night. "Room only" is the room's own
-- price (provider_services.value); this table holds the OTHER plans. Each row stores the FULL
-- nightly price of the room with that plan (not a per-person supplement), in the room's own
-- currency. No row for a plan means the room does not offer that plan.
--
--   breakfast   : room with breakfast
--   full_board  : room with breakfast, lunch and dinner
--
-- Plan codes are checked here and translated in the app's message files, so adding a plan later
-- (for example half board) is one new value in the check below plus its translations.

begin;

create table if not exists category.provider_service_meal_plans (
                                                                    id uuid primary key default public.uuid_generate_v4(),
    provider_service_id uuid not null
    references category.provider_services (id) on delete cascade,
    plan_code text not null,
    price numeric(18, 2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_provider_service_meal_plans_code
    check (plan_code in ('breakfast', 'full_board')),
    constraint ck_provider_service_meal_plans_price
    check (price >= 0),
    constraint uq_provider_service_meal_plans_service_code
    unique (provider_service_id, plan_code)
    );

comment on table category.provider_service_meal_plans is
  'Nightly price of a room for each meal plan other than room-only. Room-only is provider_services.value. A missing row means the plan is not offered.';

commit;