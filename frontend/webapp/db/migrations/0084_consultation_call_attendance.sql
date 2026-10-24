-- Who was in a consultation's call room, and when. One row per visit: a person
-- who leaves and comes back gets a new row. The browser reports joining and
-- leaving and pings while connected, so a closed tab still ends at last_seen_at.
-- Used to tell a missed call apart from a held one, and for refund questions.

create table if not exists consultation.video_session_attendance (
  id uuid primary key default public.uuid_generate_v4(),
  session_id uuid not null references consultation.video_sessions (id) on delete cascade,
  role text not null check (role in ('doctor', 'patient')),
  user_id uuid references identity.asp_net_users (id) on delete set null,
  joined_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  left_at timestamp with time zone
);

create index if not exists ix_consultation_video_session_attendance_session
  on consultation.video_session_attendance (session_id, joined_at);
