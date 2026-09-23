-- Promote an existing (already-registered) identity user to admin + superadmin
-- for local development.
--
--   docker compose -f docker-compose.dev.yml --env-file .env.dev exec -T postgres \
--     psql -U lsevin -d lsevin -v email='you@example.com' -f - < dev-seed/promote-admin.sql
--
-- or from a host psql:
--   psql "postgres://lsevin:lsevin@localhost:5432/lsevin" -v email='you@example.com' -f dev-seed/promote-admin.sql
\if :{?email}
\else
  \echo 'ERROR: pass -v email=you@example.com'
  \quit
\endif

insert into identity.asp_net_user_roles (user_id, role_id)
select u.id, r.id
from identity.asp_net_users u
join identity.asp_net_roles r on r.normalized_name in ('ADMIN', 'SUPERADMIN')
where lower(u.email) = lower(:'email')
on conflict do nothing;

select u.email, array_agg(r.name order by r.name) as roles
from identity.asp_net_users u
join identity.asp_net_user_roles ur on ur.user_id = u.id
join identity.asp_net_roles r on r.id = ur.role_id
where lower(u.email) = lower(:'email')
group by u.email;
