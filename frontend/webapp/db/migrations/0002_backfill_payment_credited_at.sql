-- Backfill the `creditedAt` marker onto payments that settled before the marker existed.
--
-- markGatewayPaymentVerified now refuses to credit a booking twice by requiring
-- `gateway_payload->>'creditedAt' is null`. Rows settled before that code shipped carry
-- no marker, so for them the only guard is the mutable `status` column — and status can
-- be walked backwards. Stamping the marker retroactively closes that window.
--
-- Additive and idempotent: it only ever adds a key to rows that already settled and do
-- not have it. It does not touch amounts, statuses, or bookings.
--
-- The timestamp is the row's own updated_at (falling back to created_at) rather than
-- now(), so the audit trail keeps saying when the money actually moved.

begin;

update booking.payments
   set gateway_payload =
         coalesce(gateway_payload, '{}'::jsonb)
         || jsonb_build_object(
              'creditedAt',
              to_char(
                coalesce(updated_at, created_at, now()) at time zone 'UTC',
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
              ),
              'creditedAtBackfilled', true
            )
 where lower(coalesce(status, '')) in ('succeeded', 'paid', 'captured', 'completed')
   and gateway_payload->>'creditedAt' is null;

commit;

-- ---------------------------------------------------------------------------
-- NOT done here, on purpose: repairing booking.bookings.paid_amount on rows that
-- were already double-credited by the race this fixes.
--
-- It cannot be scripted safely. booking-pro's repository legitimately resets
-- paid_amount to 0 and deletes payment rows when a booking is modified, so
-- `paid_amount <> sum(settled payments)` is a normal state for a rebooked booking,
-- not evidence of a double credit. Any repair has to be row-by-row and reviewed.
--
-- Use this to find candidates worth a human look — it reports, it does not change
-- anything:
--
--   select b.id,
--          b.paid_amount,
--          sum(p.source_amount) filter (
--            where lower(coalesce(p.status,'')) in ('succeeded','paid','captured','completed')
--          ) as settled_total,
--          count(*) filter (where p.gateway_payload->>'stage' = 'verified_duplicate') as duplicate_settlements
--     from booking.bookings b
--     join booking.payments p on p.booking_id = b.id
--    group by b.id, b.paid_amount
--   having b.paid_amount > coalesce(sum(p.source_amount) filter (
--            where lower(coalesce(p.status,'')) in ('succeeded','paid','captured','completed')
--          ), 0)
--    order by b.paid_amount desc;
-- ---------------------------------------------------------------------------
