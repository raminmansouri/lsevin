import { randomUUID } from "crypto";
import { sql } from "./db";
import {
  AvailabilityDate,
  AvailabilityTime,
  BookingAddon,
  BookingCatalogProvider,
  BookingCatalogService,
  BookingCatalogSpecialist,
  BookingDraftPayload,
  BookingDraftRecord,
  CheckoutResponse,
  SelectedAddon,
  UploadedDraftDocument,
} from "./types";

function toNumber(value: unknown): number {
  return value == null ? 0 : Number(value);
}

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getDayOfWeek(dateString: string): number {
  const jsDay = new Date(`${dateString}T12:00:00Z`).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildTimeSlots(
  start: string,
  end: string,
  slotIntervalMinutes: number,
): AvailabilityTime[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let current = sh * 60 + sm;
  const limit = eh * 60 + em;
  const slots: AvailabilityTime[] = [];

  while (current + slotIntervalMinutes <= limit) {
    const fromHour = String(Math.floor(current / 60)).padStart(2, "0");
    const fromMinute = String(current % 60).padStart(2, "0");
    const next = current + slotIntervalMinutes;
    const toHour = String(Math.floor(next / 60)).padStart(2, "0");
    const toMinute = String(next % 60).padStart(2, "0");
    slots.push({
      time: `${fromHour}:${fromMinute}`,
      timeFrom: `${fromHour}:${fromMinute}`,
      timeTo: `${toHour}:${toMinute}`,
      available: true,
    });
    current = next;
  }

  return slots;
}

export async function resolveCurrentUserId(request: Request): Promise<string | null> {
  const headerUserId = request.headers.get("x-user-id");
  return headerUserId || null;
}

export async function getCatalog(params: {
  providerId?: string | null;
  serviceId?: string | null;
  specialistId?: string | null;
  locale?: string;
}) {
  const { providerId, serviceId, specialistId, locale = "en" } = params;

  const providers = await sql<BookingCatalogProvider[]>`
    SELECT DISTINCT
      sp.id,
      COALESCE(common.get_translation_t(sp.name_translations, ${locale}, 'en'), '') AS name,
      sp.city,
      sp.country,
      sp.image_url AS "imageUrl"
    FROM category.service_providers sp
    WHERE sp.is_active = true
      AND (
        ${providerId ?? null}::uuid IS NULL
        OR sp.id = ${providerId ?? null}::uuid
      )
      AND (
        ${serviceId ?? null}::uuid IS NULL
        OR EXISTS (
          SELECT 1
          FROM category.provider_services ps
          WHERE ps.id = ${serviceId ?? null}::uuid
            AND ps.service_provider_id = sp.id
        )
      )
      AND (
        ${specialistId ?? null}::uuid IS NULL
        OR EXISTS (
          SELECT 1
          FROM category.provider_staffs pst
          WHERE pst.service_provider_id = sp.id
            AND pst.staff_id = ${specialistId ?? null}::uuid
            AND pst.is_active = true
        )
      )
    ORDER BY name;
  `;

  const services = await sql<BookingCatalogService[]>`
    SELECT DISTINCT
      ps.id,
      ps.service_provider_id AS "providerId",
      ps.service_definition_id AS "serviceDefinitionId",
      COALESCE(common.get_translation_t(ps.display_name_translations, ${locale}, 'en'), '') AS name,
      ps.value AS price,
      ps.currency,
      ps.duration_minutes AS "durationMinutes",
      ps.image_url AS "imageUrl",
      ps.slot_interval_minutes AS "slotIntervalMinutes"
    FROM category.provider_services ps
    WHERE ps.is_active = true
      AND (
        ${providerId ?? null}::uuid IS NULL
        OR ps.service_provider_id = ${providerId ?? null}::uuid
      )
      AND (
        ${serviceId ?? null}::uuid IS NULL
        OR ps.id = ${serviceId ?? null}::uuid
      )
      AND (
        ${specialistId ?? null}::uuid IS NULL
        OR EXISTS (
          SELECT 1
          FROM category.staff_services ss
          WHERE ss.staff_id = ${specialistId ?? null}::uuid
            AND ss.service_definition_id = ps.service_definition_id
            AND ss.is_active = true
        )
      )
    ORDER BY name;
  `;

  const specialists = await sql<BookingCatalogSpecialist[]>`
    SELECT DISTINCT
      st.id,
      COALESCE(common.get_translation_t(st.name_translations, ${locale}, 'en'), '') AS name,
      NULLIF(COALESCE(common.get_translation_t(st.title_translations, ${locale}, 'en'), ''), '') AS title,
      st.profile_image_url AS "imageUrl"
    FROM category.staff st
    WHERE st.is_active = true
      AND (
        ${providerId ?? null}::uuid IS NULL
        OR EXISTS (
          SELECT 1
          FROM category.provider_staffs pst
          WHERE pst.staff_id = st.id
            AND pst.service_provider_id = ${providerId ?? null}::uuid
            AND pst.is_active = true
        )
      )
      AND (
        ${serviceId ?? null}::uuid IS NULL
        OR EXISTS (
          SELECT 1
          FROM category.provider_services ps
          JOIN category.staff_services ss
            ON ss.service_definition_id = ps.service_definition_id
           AND ss.staff_id = st.id
           AND ss.is_active = true
          WHERE ps.id = ${serviceId ?? null}::uuid
        )
      )
      AND (
        ${specialistId ?? null}::uuid IS NULL
        OR st.id = ${specialistId ?? null}::uuid
      )
    ORDER BY name;
  `;

  return { providers, services, specialists };
}

export async function getAddons(params: {
  serviceId: string;
  includeLsevin: boolean;
  locale?: string;
}) {
  const { serviceId, includeLsevin, locale = "en" } = params;

  const rows = await sql<(BookingAddon & { details_text: string[] | null })[]>`
    SELECT
      a.id,
      a.name,
      a.description,
      a.price,
      a.source_type AS "sourceType",
      a.addon_kind AS "addonKind",
      COALESCE(array_agg(ad.detail ORDER BY ad.display_order) FILTER (WHERE ad.detail IS NOT NULL), ARRAY[]::text[]) AS details_text,
      COALESCE(a.popular, false) AS popular
    FROM category.addons a
    LEFT JOIN category.addon_details ad
      ON ad.addon_id = a.id
    WHERE a.is_active = true
      AND (
        (a.source_type = 'provider' AND EXISTS (
          SELECT 1
          FROM category.provider_service_addons psa
          WHERE psa.provider_service_id = ${serviceId}::uuid
            AND psa.addon_id = a.id
        ))
        OR (${includeLsevin} = true AND a.source_type = 'lsevin')
      )
    GROUP BY a.id, a.name, a.description, a.price, a.source_type, a.addon_kind, a.popular
    ORDER BY a.source_type, a.popular DESC, a.name;
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: toNumber(row.price),
    sourceType: row.sourceType,
    addonKind: row.addonKind,
    details: row.details_text ?? [],
    popular: row.popular,
  }));
}

export async function getAvailableDates(params: {
  specialistId: string;
  days?: number;
}) {
  const { specialistId, days = 21 } = params;

  const rows = await sql<{ day_of_week: number; specific_date: string | null }[]>`
    SELECT
      sa.day_of_week,
      CASE WHEN sa.specific_date IS NULL THEN NULL ELSE to_char(sa.specific_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') END AS specific_date
    FROM category.staff_availabilities sa
    WHERE sa.staff_id = ${specialistId}::uuid
      AND sa.availability_status_id = 1;
  `;

  const specificDateSet = new Set(rows.map((r) => r.specific_date).filter(Boolean) as string[]);
  const recurringDays = new Set(rows.filter((r) => !r.specific_date).map((r) => r.day_of_week));

  const today = new Date();
  const result: AvailabilityDate[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = addDays(today, i);
    const dateKey = toDateKey(date);
    const dow = getDayOfWeek(dateKey);
    const available = specificDateSet.has(dateKey) || recurringDays.has(dow);
    result.push({
      date: dateKey,
      dayLabel: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      available,
    });
  }

  return result;
}

export async function getAvailableTimes(params: {
  specialistId: string;
  serviceId: string;
  selectedDate: string;
}) {
  const { specialistId, serviceId, selectedDate } = params;

  const [serviceRow] = await sql<{ slot_interval_minutes: number }[]>`
    SELECT slot_interval_minutes
    FROM category.provider_services
    WHERE id = ${serviceId}::uuid;
  `;

  const slotIntervalMinutes = serviceRow?.slot_interval_minutes ?? 15;
  const targetDayOfWeek = getDayOfWeek(selectedDate);

  const windows = await sql<{ start_time: string; end_time: string }[]>`
    SELECT
      to_char(date_trunc('minute', start_time), 'HH24:MI') AS start_time,
      to_char(date_trunc('minute', end_time), 'HH24:MI') AS end_time
    FROM category.staff_availabilities
    WHERE staff_id = ${specialistId}::uuid
      AND availability_status_id = 1
      AND (
        (specific_date IS NULL AND day_of_week = ${targetDayOfWeek})
        OR to_char(specific_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') = ${selectedDate}
      )
    ORDER BY start_time;
  `;

  const busy = await sql<{ selected_time_from: string; selected_time_to: string }[]>`
    SELECT
      to_char(selected_time_from, 'HH24:MI') AS selected_time_from,
      to_char(selected_time_to, 'HH24:MI') AS selected_time_to
    FROM booking.bookings
    WHERE specialist_id = ${specialistId}::uuid
      AND selected_date = ${selectedDate}::date
      AND booking_status IN ('Pending', 'Confirmed');
  `;

  const allSlots = windows.flatMap((window) =>
    buildTimeSlots(window.start_time, window.end_time, slotIntervalMinutes),
  );

  const busyRanges = busy.map((row) => ({
    from: row.selected_time_from,
    to: row.selected_time_to,
  }));

  return allSlots.map((slot) => {
    const overlap = busyRanges.some((range) => !(slot.timeTo <= range.from || slot.timeFrom >= range.to));
    return { ...slot, available: !overlap };
  });
}

async function calculateServiceSubtotal(serviceId: string | null | undefined) {
  if (!serviceId) return 0;
  const [row] = await sql<{ value: string | number }[]>`
    SELECT value
    FROM category.provider_services
    WHERE id = ${serviceId}::uuid;
  `;
  return toNumber(row?.value);
}

export async function saveDraft(userId: string | null, payload: BookingDraftPayload): Promise<BookingDraftRecord> {
  const selectedAddons = payload.selectedAddons ?? [];
  const documents = payload.documents ?? [];
  const serviceSubtotal = await calculateServiceSubtotal(payload.serviceId);
  const addonsAmount = selectedAddons.reduce(
    (sum, addon) => sum + toNumber(addon.unitPrice) * addon.quantity,
    0,
  );
  const totalAmount = serviceSubtotal + addonsAmount;

  const [draft] = await sql.begin(async (tx) => {
    let draftId = payload.draftId;

    if (!draftId) {
      const [created] = await tx<{ id: string }[]>`
        INSERT INTO booking.booking_drafts (
          user_id,
          provider_id,
          service_id,
          specialist_id,
          selected_date,
          selected_time,
          selected_time_from,
          selected_time_to,
          use_lsevin,
          current_step,
          payment_method,
          currency,
          subtotal_amount,
          addons_amount,
          total_amount,
          status,
          notes
        ) VALUES (
          ${userId}::uuid,
          ${payload.providerId ?? null}::uuid,
          ${payload.serviceId ?? null}::uuid,
          ${payload.specialistId ?? null}::uuid,
          ${payload.selectedDate ?? null}::date,
          ${payload.selectedTime ?? null}::time,
          ${payload.selectedTimeFrom ?? null}::time,
          ${payload.selectedTimeTo ?? null}::time,
          ${payload.useLsevin ?? false},
          ${payload.currentStep ?? 1},
          ${payload.paymentMethod ?? null},
          ${payload.currency ?? 'USD'},
          ${serviceSubtotal},
          ${addonsAmount},
          ${totalAmount},
          'Draft',
          ${payload.notes ?? null}
        ) RETURNING id;
      `;
      draftId = created.id;
    } else {
      await tx`
        UPDATE booking.booking_drafts
        SET
          provider_id = COALESCE(${payload.providerId ?? null}::uuid, provider_id),
          service_id = COALESCE(${payload.serviceId ?? null}::uuid, service_id),
          specialist_id = COALESCE(${payload.specialistId ?? null}::uuid, specialist_id),
          selected_date = COALESCE(${payload.selectedDate ?? null}::date, selected_date),
          selected_time = COALESCE(${payload.selectedTime ?? null}::time, selected_time),
          selected_time_from = COALESCE(${payload.selectedTimeFrom ?? null}::time, selected_time_from),
          selected_time_to = COALESCE(${payload.selectedTimeTo ?? null}::time, selected_time_to),
          use_lsevin = COALESCE(${payload.useLsevin ?? null}, use_lsevin),
          current_step = GREATEST(current_step, ${payload.currentStep ?? 1}),
          payment_method = COALESCE(${payload.paymentMethod ?? null}, payment_method),
          currency = COALESCE(${payload.currency ?? null}, currency),
          subtotal_amount = ${serviceSubtotal},
          addons_amount = ${addonsAmount},
          total_amount = ${totalAmount},
          notes = COALESCE(${payload.notes ?? null}, notes),
          updated_at = now()
        WHERE id = ${draftId}::uuid;
      `;

      await tx`DELETE FROM booking.booking_draft_addons WHERE draft_id = ${draftId}::uuid;`;
      await tx`DELETE FROM booking.booking_draft_documents WHERE draft_id = ${draftId}::uuid;`;
    }

    if (selectedAddons.length > 0) {
      const addonValues = selectedAddons.map((addon) => ({
        draft_id: draftId,
        addon_id: addon.addonId,
        source_type: addon.sourceType,
        addon_kind: addon.addonKind,
        quantity: addon.quantity,
        unit_price: addon.unitPrice,
        config: JSON.stringify(addon.config ?? {}),
      }));

      await tx`
        INSERT INTO booking.booking_draft_addons ${tx(addonValues, 'draft_id', 'addon_id', 'source_type', 'addon_kind', 'quantity', 'unit_price', 'config')}
      `;
    }

    if (documents.length > 0) {
      const documentValues = documents.map((document) => ({
        id: document.id ?? randomUUID(),
        draft_id: draftId,
        requirement_id: document.requirementId ?? null,
        title: document.title,
        file_name: document.fileName,
        file_url: document.fileUrl,
        mime_type: document.mimeType ?? null,
        size_bytes: document.sizeBytes ?? null,
      }));

      await tx`
        INSERT INTO booking.booking_draft_documents ${tx(documentValues, 'id', 'draft_id', 'requirement_id', 'title', 'file_name', 'file_url', 'mime_type', 'size_bytes')}
      `;
    }

    const [record] = await tx<{
      id: string;
      providerId: string | null;
      serviceId: string | null;
      specialistId: string | null;
      selectedDate: string | null;
      selectedTime: string | null;
      selectedTimeFrom: string | null;
      selectedTimeTo: string | null;
      useLsevin: boolean;
      currentStep: number;
      paymentMethod: string | null;
      currency: string;
      subtotalAmount: string | number;
      addonsAmount: string | number;
      totalAmount: string | number;
      status: string;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }[]>`
      SELECT
        id,
        provider_id AS "providerId",
        service_id AS "serviceId",
        specialist_id AS "specialistId",
        CASE WHEN selected_date IS NULL THEN NULL ELSE to_char(selected_date, 'YYYY-MM-DD') END AS "selectedDate",
        CASE WHEN selected_time IS NULL THEN NULL ELSE to_char(selected_time, 'HH24:MI') END AS "selectedTime",
        CASE WHEN selected_time_from IS NULL THEN NULL ELSE to_char(selected_time_from, 'HH24:MI') END AS "selectedTimeFrom",
        CASE WHEN selected_time_to IS NULL THEN NULL ELSE to_char(selected_time_to, 'HH24:MI') END AS "selectedTimeTo",
        use_lsevin AS "useLsevin",
        current_step AS "currentStep",
        payment_method AS "paymentMethod",
        currency,
        subtotal_amount AS "subtotalAmount",
        addons_amount AS "addonsAmount",
        total_amount AS "totalAmount",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM booking.booking_drafts
      WHERE id = ${draftId}::uuid;
    `;

    return record as any;
  });

  return getDraftById(draft.id, userId);
}

export async function getDraftById(draftId: string, userId: string | null): Promise<BookingDraftRecord> {
  const [draft] = await sql<any[]>`
    SELECT
      id,
      provider_id AS "providerId",
      service_id AS "serviceId",
      specialist_id AS "specialistId",
      CASE WHEN selected_date IS NULL THEN NULL ELSE to_char(selected_date, 'YYYY-MM-DD') END AS "selectedDate",
      CASE WHEN selected_time IS NULL THEN NULL ELSE to_char(selected_time, 'HH24:MI') END AS "selectedTime",
      CASE WHEN selected_time_from IS NULL THEN NULL ELSE to_char(selected_time_from, 'HH24:MI') END AS "selectedTimeFrom",
      CASE WHEN selected_time_to IS NULL THEN NULL ELSE to_char(selected_time_to, 'HH24:MI') END AS "selectedTimeTo",
      use_lsevin AS "useLsevin",
      current_step AS "currentStep",
      payment_method AS "paymentMethod",
      currency,
      subtotal_amount AS "subtotalAmount",
      addons_amount AS "addonsAmount",
      total_amount AS "totalAmount",
      status,
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM booking.booking_drafts
    WHERE id = ${draftId}::uuid
      AND (${userId ?? null}::uuid IS NULL OR user_id = ${userId ?? null}::uuid OR user_id IS NULL)
    LIMIT 1;
  `;

  if (!draft) {
    throw new Error("Draft booking not found.");
  }

  const addons = await sql<{
    addon_id: string;
    source_type: string;
    addon_kind: any;
    quantity: number;
    unit_price: string | number;
    config: Record<string, unknown>;
  }[]>`
    SELECT addon_id, source_type, addon_kind, quantity, unit_price, config
    FROM booking.booking_draft_addons
    WHERE draft_id = ${draftId}::uuid
    ORDER BY created_at;
  `;

  const documents = await sql<any[]>`
    SELECT
      id,
      requirement_id AS "requirementId",
      title,
      file_name AS "fileName",
      file_url AS "fileUrl",
      mime_type AS "mimeType",
      size_bytes AS "sizeBytes"
    FROM booking.booking_draft_documents
    WHERE draft_id = ${draftId}::uuid
    ORDER BY created_at;
  `;

  return {
    ...draft,
    subtotalAmount: toNumber(draft.subtotalAmount),
    addonsAmount: toNumber(draft.addonsAmount),
    totalAmount: toNumber(draft.totalAmount),
    selectedAddons: addons.map((addon) => ({
      addonId: addon.addon_id,
      sourceType: addon.source_type,
      addonKind: addon.addon_kind,
      quantity: addon.quantity,
      unitPrice: toNumber(addon.unit_price),
      config: addon.config ?? {},
    })),
    documents,
  };
}

export async function listOpenDrafts(userId: string | null) {
  if (!userId) return [];

  return sql<any[]>`
    SELECT
      id,
      provider_id AS "providerId",
      service_id AS "serviceId",
      specialist_id AS "specialistId",
      CASE WHEN selected_date IS NULL THEN NULL ELSE to_char(selected_date, 'YYYY-MM-DD') END AS "selectedDate",
      current_step AS "currentStep",
      total_amount AS "totalAmount",
      currency,
      status,
      updated_at AS "updatedAt"
    FROM booking.booking_drafts
    WHERE user_id = ${userId}::uuid
      AND status = 'Draft'
    ORDER BY updated_at DESC;
  `;
}

export async function finalizeCheckout(userId: string | null, input: {
  draftId: string;
  paymentMethod: string;
  currency: string;
}): Promise<CheckoutResponse> {
  const draft = await getDraftById(input.draftId, userId);

  if (!draft.providerId || !draft.serviceId || !draft.specialistId) {
    throw new Error("Provider, service, and specialist must be selected before checkout.");
  }

  if (!draft.selectedDate || !draft.selectedTime || !draft.selectedTimeFrom || !draft.selectedTimeTo) {
    throw new Error("Date and time must be selected before checkout.");
  }

  const bookingId = randomUUID();
  const paymentId = randomUUID();
  const paymentStatus = input.paymentMethod === "online_gateway" ? "PendingGateway" : "Pending";
  const bookingStatus = input.paymentMethod === "pay_on_arrival" ? "Pending" : "Pending";

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO booking.bookings (
        provider_id,
        service_id,
        specialist_id,
        selected_date,
        selected_date_from,
        selected_date_to,
        selected_time,
        selected_time_from,
        selected_time_to,
        payment_method,
        add_ons,
        upload_files,
        additional_services,
        payment_status,
        id,
        booking_status,
        user_id
      ) VALUES (
        ${draft.providerId}::uuid,
        ${draft.serviceId}::uuid,
        ${draft.specialistId}::uuid,
        ${draft.selectedDate}::date,
        ${draft.selectedTimeFrom}::time,
        ${draft.selectedTimeTo}::time,
        ${draft.selectedTime}::time,
        ${draft.selectedTimeFrom}::time,
        ${draft.selectedTimeTo}::time,
        ${input.paymentMethod},
        ${JSON.stringify(draft.selectedAddons)},
        ${JSON.stringify(draft.documents)},
        ${JSON.stringify([])},
        ${paymentStatus},
        ${bookingId}::uuid,
        ${bookingStatus},
        ${userId ?? null}::uuid
      );
    `;

    if (draft.selectedAddons.length > 0) {
      const addonRows = draft.selectedAddons.map((addon) => ({
        id: randomUUID(),
        booking_id: bookingId,
        addon_id: addon.addonId,
        source_type: addon.sourceType,
        addon_kind: addon.addonKind,
        quantity: addon.quantity,
        unit_price: addon.unitPrice,
        config: JSON.stringify(addon.config ?? {}),
        created_at: new Date().toISOString(),
      }));

      await tx`
        INSERT INTO booking.booking_addons ${tx(addonRows, 'id', 'booking_id', 'addon_id', 'source_type', 'addon_kind', 'quantity', 'unit_price', 'config', 'created_at')}
      `;
    }

    if (draft.documents.length > 0) {
      const documentRows = draft.documents.map((document) => ({
        id: document.id ?? randomUUID(),
        booking_id: bookingId,
        requirement_id: document.requirementId ?? null,
        title: document.title,
        file_name: document.fileName,
        file_url: document.fileUrl,
        mime_type: document.mimeType ?? null,
        size_bytes: document.sizeBytes ?? null,
        created_at: new Date().toISOString(),
      }));

      await tx`
        INSERT INTO booking.booking_documents ${tx(documentRows, 'id', 'booking_id', 'requirement_id', 'title', 'file_name', 'file_url', 'mime_type', 'size_bytes', 'created_at')}
      `;
    }

    await tx`
      INSERT INTO booking.payments (
        id,
        booking_id,
        user_id,
        payment_method,
        gateway,
        amount,
        currency,
        status,
        external_reference,
        gateway_payload
      ) VALUES (
        ${paymentId}::uuid,
        ${bookingId}::uuid,
        ${userId ?? null}::uuid,
        ${input.paymentMethod},
        ${input.paymentMethod === 'online_gateway' ? 'placeholder-gateway' : 'manual'},
        ${draft.totalAmount},
        ${input.currency},
        ${paymentStatus},
        ${null},
        ${JSON.stringify({ draftId: draft.id })}
      );
    `;

    await tx`
      UPDATE booking.booking_drafts
      SET status = 'Converted', submitted_at = now(), updated_at = now()
      WHERE id = ${draft.id}::uuid;
    `;
  });

  return {
    bookingId,
    paymentId,
    paymentStatus,
    bookingStatus,
  };
}
