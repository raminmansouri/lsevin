-- Booking Management production hardening.
-- Keep only one current assignment for a booking/provider pair before adding
-- the partial unique index. Historical rows remain as `reassigned`.

with ranked as (
  select id,
         row_number() over (
           partition by booking_id, service_provider_id
           order by created_at desc, id desc
         ) as row_no
  from booking_management.booking_assignments
  where assignment_status = 'assigned'
)
update booking_management.booking_assignments a
set assignment_status = 'reassigned', updated_at = now()
from ranked r
where a.id = r.id and r.row_no > 1;

create unique index if not exists uq_booking_management_current_assignment
  on booking_management.booking_assignments (booking_id, service_provider_id)
  where assignment_status = 'assigned';

create index if not exists ix_booking_management_status_changes_provider_created
  on booking_management.booking_status_changes (service_provider_id, created_at desc);

create index if not exists ix_booking_management_notes_provider_created
  on booking_management.provider_booking_notes (service_provider_id, created_at desc);
