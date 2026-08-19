import "server-only";
import type { Sql } from "@core/db/client";

type AvailabilityContext = {
  bookingId: string;
  providerId: string;
  serviceId: string;
  customerId: string | null;
  specialistId: string | null;
  assignedStaffId: string | null;
  assignedResourceId: string | null;
  providerStaffId: string | null;
  selectedTime: string | null;
  selectedTimeFrom: string | null;
  selectedTimeTo: string | null;
  serviceDurationMinutes: number;
  serviceSlotIntervalMinutes: number;
  resourceCapacity: number | null;
};

type AvailabilityRuleRow = {
  id: string;
  targetType: string;
  targetId: string;
  providerServiceId: string | null;
  resourceId: string | null;
  specificDate: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isAvailable: boolean;
  capacity: number | null;
  priority: number;
};

type AvailabilityCapacity = {
  provider: number | null;
  service: number | null;
  staff: number | null;
  resource: number | null;
};

export type BookingAvailabilityCheck = {
  requestedDate: string;
  requestedTime: string;
  requestedEndTime: string;
  durationMinutes: number;
  staffId: string | null;
  resourceId: string | null;
  capacities: AvailabilityCapacity;
};

function minutesFromTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
}

function timeFromMinutes(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function positiveInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function minimumCapacity(values: Array<number | null | undefined>): number | null {
  const valid = values.map((value) => positiveInt(value)).filter((value) => value > 0);
  return valid.length ? Math.min(...valid) : null;
}

function overlapsWindow(rule: AvailabilityRuleRow, startMinutes: number, endMinutes: number): boolean {
  const ruleStart = minutesFromTime(rule.startsAt) ?? 0;
  const ruleEnd = minutesFromTime(rule.endsAt) ?? 24 * 60;
  return ruleStart < endMinutes && ruleEnd > startMinutes;
}

function containsWindow(rule: AvailabilityRuleRow, startMinutes: number, endMinutes: number): boolean {
  const ruleStart = minutesFromTime(rule.startsAt) ?? 0;
  const ruleEnd = minutesFromTime(rule.endsAt) ?? 24 * 60;
  return ruleStart <= startMinutes && ruleEnd >= endMinutes;
}

function ruleGroupKey(rule: AvailabilityRuleRow): string {
  return [rule.targetType, rule.targetId, rule.providerServiceId || "*", rule.resourceId || "*"].join(":");
}

function targetLabel(targetType: string): string {
  switch (targetType) {
    case "provider": return "Provider";
    case "provider_service": return "Service";
    case "staff":
    case "provider_staff": return "Staff";
    case "bookable_resource": return "Resource";
    default: return "Availability";
  }
}

function selectEffectiveRules(rows: AvailabilityRuleRow[]): AvailabilityRuleRow[] {
  const groups = new Map<string, AvailabilityRuleRow[]>();
  for (const row of rows) {
    const key = ruleGroupKey(row);
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  const effective: AvailabilityRuleRow[] = [];
  for (const group of groups.values()) {
    const specific = group.filter((row) => Boolean(row.specificDate));
    effective.push(...(specific.length ? specific : group));
  }
  return effective;
}

function evaluateRules(rows: AvailabilityRuleRow[], startMinutes: number, endMinutes: number) {
  const effective = selectEffectiveRules(rows);
  const capacities: Partial<Record<"provider" | "service" | "staff" | "resource", number | null>> = {};
  const byGroup = new Map<string, AvailabilityRuleRow[]>();
  for (const row of effective) {
    const key = ruleGroupKey(row);
    byGroup.set(key, [...(byGroup.get(key) || []), row]);
  }
  for (const group of byGroup.values()) {
    const blocked = group.some((row) => !row.isAvailable && overlapsWindow(row, startMinutes, endMinutes));
    if (blocked) throw new Error(`${targetLabel(group[0]?.targetType || "")} is unavailable at the requested time.`);
    const available = group.filter((row) => row.isAvailable);
    const containing = available.filter((row) => containsWindow(row, startMinutes, endMinutes));
    if (available.length && !containing.length) {
      throw new Error(`${targetLabel(group[0]?.targetType || "")} availability does not contain the requested booking window.`);
    }
    const capacity = minimumCapacity(containing.map((row) => row.capacity));
    if (!capacity) continue;
    const targetType = group[0]?.targetType;
    const bucket = targetType === "provider" ? "provider"
      : targetType === "provider_service" ? "service"
      : targetType === "staff" || targetType === "provider_staff" ? "staff"
      : targetType === "bookable_resource" ? "resource"
      : null;
    if (bucket) capacities[bucket] = minimumCapacity([capacities[bucket], capacity]);
  }
  return capacities;
}

async function loadContext(tx: Sql, bookingId: string, providerId: string): Promise<AvailabilityContext> {
  const rows = await tx<AvailabilityContext[]>`
    select
      b.id::text as "bookingId", b.provider_id::text as "providerId", b.service_id::text as "serviceId",
      b.user_id::text as "customerId", b.specialist_id::text as "specialistId",
      ba.staff_id::text as "assignedStaffId", ba.resource_id::text as "assignedResourceId",
      psr.id::text as "providerStaffId", b.selected_time::text as "selectedTime",
      b.selected_time_from::text as "selectedTimeFrom", b.selected_time_to::text as "selectedTimeTo",
      ps.duration_minutes::int as "serviceDurationMinutes", ps.slot_interval_minutes::int as "serviceSlotIntervalMinutes",
      br.total_capacity::int as "resourceCapacity"
    from booking.bookings b
    join category.provider_services ps on ps.id=b.service_id and ps.service_provider_id=b.provider_id and ps.is_active=true
    left join lateral (
      select a.staff_id,a.resource_id from booking_management.booking_assignments a
      where a.booking_id=b.id and a.service_provider_id=b.provider_id and a.assignment_status='assigned'
      order by a.created_at desc limit 1
    ) ba on true
    left join category.provider_staffs psr
      on psr.service_provider_id=b.provider_id and psr.staff_id=coalesce(ba.staff_id,b.specialist_id) and psr.is_active=true
    left join provider_portal.bookable_resources br
      on br.id=ba.resource_id and br.service_provider_id=b.provider_id and br.is_active=true
    where b.id=${bookingId}::uuid and b.provider_id=${providerId}::uuid
    limit 1
  `;
  const context = rows[0];
  if (!context) throw new Error("Booking availability context could not be resolved for this provider.");
  return context;
}

async function lockAvailabilityKeys(tx: Sql, context: AvailabilityContext, requestedDate: string) {
  const staffId = context.assignedStaffId || context.specialistId;
  const keys = [
    `booking-slot:provider:${context.providerId}:${requestedDate}`,
    `booking-slot:service:${context.serviceId}:${requestedDate}`,
    staffId ? `booking-slot:staff:${staffId}:${requestedDate}` : null,
    context.assignedResourceId ? `booking-slot:resource:${context.assignedResourceId}:${requestedDate}` : null,
    context.customerId ? `booking-slot:customer:${context.customerId}:${requestedDate}` : null,
  ].filter((value): value is string => Boolean(value)).sort();
  for (const key of keys) await tx`select pg_advisory_xact_lock(hashtextextended(${key},0))`;
}

async function assertProviderOperatingHours(tx: Sql, providerId: string, requestedDate: string, startMinutes: number, endMinutes: number) {
  const rows = await tx<{isClosed:boolean;opensAt:string|null;closesAt:string|null}[]>`
    select poh.is_closed as "isClosed",poh.opens_at::text as "opensAt",poh.closes_at::text as "closesAt"
    from provider_portal.provider_operating_hours poh
    where poh.service_provider_id=${providerId}::uuid
      and poh.day_of_week=extract(isodow from ${requestedDate}::date)::smallint
    limit 1
  `;
  const hours = rows[0];
  if (!hours) return;
  if (hours.isClosed) throw new Error("Provider is closed on the requested date.");
  const opens = minutesFromTime(hours.opensAt);
  const closes = minutesFromTime(hours.closesAt);
  if (opens != null && startMinutes < opens) throw new Error("Requested time is before provider operating hours.");
  if (closes != null && endMinutes > closes) throw new Error("Requested booking window extends beyond provider operating hours.");
}

async function loadRelevantRules(tx: Sql, context: AvailabilityContext, requestedDate: string): Promise<AvailabilityRuleRow[]> {
  const staffId = context.assignedStaffId || context.specialistId || "";
  const providerStaffId = context.providerStaffId || "";
  const resourceId = context.assignedResourceId || "";
  return tx<AvailabilityRuleRow[]>`
    select gar.id::text as id,gar.target_type as "targetType",gar.target_id::text as "targetId",
      gar.provider_service_id::text as "providerServiceId",gar.resource_id::text as "resourceId",
      gar.specific_date::text as "specificDate",gar.starts_at::text as "startsAt",gar.ends_at::text as "endsAt",
      gar.is_available as "isAvailable",gar.capacity::int as capacity,gar.priority::int as priority
    from provider_portal.generic_availability_rules gar
    where gar.service_provider_id=${context.providerId}::uuid
      and gar.is_active=true
      and (gar.provider_service_id is null or gar.provider_service_id=${context.serviceId}::uuid)
      and (gar.resource_id is null or gar.resource_id=nullif(${resourceId},'')::uuid)
      and (gar.specific_date=${requestedDate}::date or (gar.specific_date is null and gar.day_of_week=extract(isodow from ${requestedDate}::date)::smallint))
      and (
        (gar.target_type='provider' and gar.target_id=${context.providerId}::uuid)
        or (gar.target_type='provider_service' and gar.target_id=${context.serviceId}::uuid)
        or (gar.target_type='staff' and gar.target_id=nullif(${staffId},'')::uuid)
        or (gar.target_type='provider_staff' and gar.target_id=nullif(${providerStaffId},'')::uuid)
        or (gar.target_type='bookable_resource' and gar.target_id=nullif(${resourceId},'')::uuid)
      )
    order by gar.priority desc,gar.specific_date nulls last,gar.starts_at nulls first
  `;
}

async function countOverlaps(tx: Sql, context: AvailabilityContext, requestedDate: string, startTime: string, endTime: string) {
  const staffId = context.assignedStaffId || context.specialistId || "";
  const resourceId = context.assignedResourceId || "";
  const customerId = context.customerId || "";
  const rows = await tx<{providerOverlaps:number;serviceOverlaps:number;staffOverlaps:number;resourceOverlaps:number;customerOverlaps:number}[]>`
    with candidate as (
      select b.id,b.provider_id,b.service_id,b.specialist_id,b.user_id,
        coalesce(b.selected_time_from,b.selected_time) as starts_at,
        coalesce(b.selected_time_to,b.selected_time_from + make_interval(mins => greatest(ps.duration_minutes,ps.slot_interval_minutes,15)),b.selected_time + make_interval(mins => greatest(ps.duration_minutes,ps.slot_interval_minutes,15))) as ends_at
      from booking.bookings b join category.provider_services ps on ps.id=b.service_id
      where b.id<>${context.bookingId}::uuid and b.selected_date=${requestedDate}::date and b.booking_ui_mode='default_slot'
        and b.booking_status not in ('Draft','Completed','Cancelled','NoShow') and coalesce(b.selected_time_from,b.selected_time) is not null
    ), overlapping as (
      select c.* from candidate c where c.starts_at < ${endTime}::time and c.ends_at > ${startTime}::time
    )
    select
      count(distinct o.id) filter (where o.provider_id=${context.providerId}::uuid)::int as "providerOverlaps",
      count(distinct o.id) filter (where o.provider_id=${context.providerId}::uuid and o.service_id=${context.serviceId}::uuid)::int as "serviceOverlaps",
      count(distinct o.id) filter (where nullif(${staffId},'')::uuid is not null and (o.specialist_id=nullif(${staffId},'')::uuid or exists (select 1 from booking_management.booking_assignments ba where ba.booking_id=o.id and ba.staff_id=nullif(${staffId},'')::uuid and ba.assignment_status='assigned')))::int as "staffOverlaps",
      count(distinct o.id) filter (where nullif(${resourceId},'')::uuid is not null and exists (select 1 from booking_management.booking_assignments ba where ba.booking_id=o.id and ba.resource_id=nullif(${resourceId},'')::uuid and ba.assignment_status='assigned'))::int as "resourceOverlaps",
      count(distinct o.id) filter (where nullif(${customerId},'')::uuid is not null and o.user_id=nullif(${customerId},'')::uuid)::int as "customerOverlaps"
    from overlapping o
  `;
  return rows[0] || { providerOverlaps:0,serviceOverlaps:0,staffOverlaps:0,resourceOverlaps:0,customerOverlaps:0 };
}

export async function assertBookingRescheduleAvailable(tx: Sql,input: { bookingId: string; providerId: string; requestedDate: string; requestedTime: string }): Promise<BookingAvailabilityCheck> {
  const context = await loadContext(tx,input.bookingId,input.providerId);
  await lockAvailabilityKeys(tx,context,input.requestedDate);
  const requestedStart = minutesFromTime(input.requestedTime);
  if (requestedStart == null) throw new Error("Requested booking time is invalid.");
  const currentStart = minutesFromTime(context.selectedTimeFrom || context.selectedTime);
  const currentEnd = minutesFromTime(context.selectedTimeTo);
  const existingDuration = currentStart != null && currentEnd != null && currentEnd > currentStart ? currentEnd-currentStart : 0;
  const durationMinutes = positiveInt(existingDuration) || positiveInt(context.serviceDurationMinutes) || positiveInt(context.serviceSlotIntervalMinutes,15) || 15;
  const requestedEnd = requestedStart + durationMinutes;
  if (requestedEnd > 24*60) throw new Error("Requested booking window cannot cross midnight.");
  await assertProviderOperatingHours(tx,context.providerId,input.requestedDate,requestedStart,requestedEnd);
  const rules = await loadRelevantRules(tx,context,input.requestedDate);
  const ruleCapacities = evaluateRules(rules,requestedStart,requestedEnd);
  const staffId = context.assignedStaffId || context.specialistId;
  const capacities: AvailabilityCapacity = {
    provider: ruleCapacities.provider ?? null,
    service: ruleCapacities.service ?? null,
    staff: staffId ? (ruleCapacities.staff ?? 1) : null,
    resource: context.assignedResourceId ? minimumCapacity([context.resourceCapacity,ruleCapacities.resource]) : null,
  };
  if (context.assignedResourceId && !capacities.resource) throw new Error("Assigned resource is no longer active or has no valid capacity.");
  const startTime = timeFromMinutes(requestedStart);
  const endTime = timeFromMinutes(requestedEnd);
  const overlaps = await countOverlaps(tx,context,input.requestedDate,startTime,endTime);
  if (capacities.provider != null && overlaps.providerOverlaps >= capacities.provider) throw new Error("Provider capacity is full for the requested booking window.");
  if (capacities.service != null && overlaps.serviceOverlaps >= capacities.service) throw new Error("Service capacity is full for the requested booking window.");
  if (capacities.staff != null && overlaps.staffOverlaps >= capacities.staff) throw new Error("Assigned staff already has a conflicting booking at the requested time.");
  if (capacities.resource != null && overlaps.resourceOverlaps >= capacities.resource) throw new Error("Assigned resource capacity is full at the requested time.");
  if (context.customerId && overlaps.customerOverlaps >= 1) throw new Error("Customer already has another booking that overlaps the requested time.");
  return {requestedDate:input.requestedDate,requestedTime:startTime,requestedEndTime:endTime,durationMinutes,staffId:staffId||null,resourceId:context.assignedResourceId,capacities};
}
