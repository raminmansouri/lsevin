-- ---------------------------------------------------------------------------
-- 0080 — Tours operations layer (check-in, tracking, notices, guides, waitlist,
-- incidents, sweeper). Additive only: one settings default and the indexes the
-- ops queries and the sweeper rely on. No existing column, constraint or row
-- is changed.
-- ---------------------------------------------------------------------------

-- Emergency contact shown on the live-trip screen (C-079). Operators replace it
-- per market through tour.settings; it is never empty.
insert into tour.settings (key, value) values
  ('emergency_contact', '{"phone":"112","label":"Emergency services"}')
on conflict (key) do nothing;

-- Live view / milestones / notices read by departure, newest first.
create index if not exists ix_milestones_departure on tour.milestones (departure_id, created_at desc);
create index if not exists ix_notices_departure on tour.notices (departure_id, created_at desc);
create index if not exists ix_notice_deliveries_booking on tour.notice_deliveries (booking_id, created_at desc);

-- Check-in counts and manifest per departure.
create index if not exists ix_checkins_departure on tour.checkins (departure_id, scanned_at);

-- Sweeper: active sessions by departure end, purge by retention.
create index if not exists ix_tracking_sessions_retention on tour.tracking_sessions (retention_until) where ended_at is not null;
create index if not exists ix_tracking_sessions_departure on tour.tracking_sessions (departure_id, started_at desc);

-- Assignments by departure and by guide (schedule, manifest authorization).
create index if not exists ix_assignments_departure on tour.departure_assignments (departure_id) where status in ('assigned','accepted');
create index if not exists ix_assignments_guide on tour.departure_assignments (guide_id, during) where guide_id is not null;

-- Waitlist FIFO per departure; inquiries / incidents / reviews per provider views.
create index if not exists ix_waitlist_departure on tour.waitlist (departure_id, status, created_at);
create index if not exists ix_inquiries_tour on tour.inquiries (tour_id, status, created_at desc);
create index if not exists ix_incidents_provider on tour.incidents (service_provider_id, status, created_at desc);
create index if not exists ix_incidents_departure on tour.incidents (departure_id);

-- Sweeper: past departures still open.
create index if not exists ix_departures_open_by_end on tour.departures (ends_at)
  where tour_id is not null and status in ('scheduled','delayed','in_progress');
-- (Guide bios in tour.content are found through the existing unique
-- (entity_type, entity_id, field_key, locale) index; no extra index needed.)
