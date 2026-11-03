-- A video consultation GP signs in with an ordinary app account (identity.asp_net_users),
-- created or linked from the GP form in the consultation admin. One account per GP.
alter table consultation.video_doctors
  add column if not exists user_id uuid references identity.asp_net_users (id) on delete set null;

create unique index if not exists ux_consultation_video_doctors_user
  on consultation.video_doctors (user_id)
  where user_id is not null;
