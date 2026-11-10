-- Video consultation: the "consult before treatment" button on a provider's page opens the
-- booking of that provider's own doctors, so a session can now start from a provider page too.

alter table consultation.video_sessions
  drop constraint if exists ck_video_sessions_source;

alter table consultation.video_sessions
  add constraint ck_video_sessions_source
  check (source is null or source in ('home_card', 'doctors_page', 'provider', 'service', 'specialist', 'booking'));
