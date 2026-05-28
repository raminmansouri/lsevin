"use server";

import { revalidatePath } from "next/cache";

import sql from "@/config/database/db";
import { getUserId } from "@/lib/auth/session";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";

import {
  adminBugReportMessageSchema,
  assignBugReportSchema,
  createBugReportSchema,
  customerBugReportReplySchema,
  formDataBoolean,
  formDataJson,
  formDataString,
  updateBugReportStatusSchema,
} from "./schemas";
import { queueBugReportUpdateNotifications } from "./server/notifications";
import { getBugReportFilesFromFormData, storeBugReportFiles } from "./server/upload";
import { ActionResult, BugReportAttachment, BugReportStatus } from "./types";

async function resolveCurrentUserId(): Promise<string | null> {
  try {
    return await getUserId();
  } catch {
    return null;
  }
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  try {
    return await resolveCurrentNotificationCustomerId();
  } catch {
    return null;
  }
}


function buildCustomerBugReportOwnershipWhere(tag: any, input: { userId: string | null; customerId: string | null }) {
  if (input.userId && input.customerId) {
    return tag`(customer_user_id = ${input.userId}::uuid or customer_id = ${input.customerId}::uuid)`;
  }

  if (input.userId) {
    return tag`customer_user_id = ${input.userId}::uuid`;
  }

  if (input.customerId) {
    return tag`customer_id = ${input.customerId}::uuid`;
  }

  return tag`false`;
}

function fieldErrors(error: any) {
  const flattened = typeof error?.flatten === "function" ? error.flatten() : null;
  return flattened?.fieldErrors as Record<string, string[]> | undefined;
}

function supportConversationSource(sourceArea: string) {
  if (sourceArea === "booking" || sourceArea === "payment") return "booking";
  if (sourceArea === "provider_portal") return "provider_page";
  if (sourceArea === "admin") return "admin_created";
  return "support_page";
}

function conversationStatusForBugStatus(status: BugReportStatus) {
  if (status === "closed") return "closed";
  if (status === "resolved" || status === "duplicate" || status === "wont_fix") return "resolved";
  if (status === "need_info") return "pending";
  return "open";
}

function buildInitialMessage(input: {
  description: string;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  reproductionSteps: string[];
}) {
  const sections = [input.description.trim()];
  if (input.expectedBehavior) sections.push(`Expected:\n${input.expectedBehavior}`);
  if (input.actualBehavior) sections.push(`Actual:\n${input.actualBehavior}`);
  if (input.reproductionSteps.length > 0) {
    sections.push(`Steps:\n${input.reproductionSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`);
  }
  return sections.join("\n\n");
}

async function insertBugReportMedia(input: {
  tx: any;
  bugReportId: string;
  messageId: string;
  attachments: BugReportAttachment[];
}) {
  let index = 0;
  for (const attachment of input.attachments) {
    await input.tx`
      insert into support.bug_report_media (
        bug_report_id,
        message_id,
        media_id,
        file_url,
        file_name,
        mime_type,
        media_type,
        file_size,
        width,
        height,
        display_order,
        metadata
      ) values (
        ${input.bugReportId}::uuid,
        ${input.messageId}::uuid,
        ${attachment.mediaId ? input.tx`${attachment.mediaId}::uuid` : null},
        ${attachment.fileUrl},
        ${attachment.fileName},
        ${attachment.mimeType ?? null},
        ${attachment.mediaType},
        ${attachment.fileSize ?? 0},
        ${attachment.width ?? null},
        ${attachment.height ?? null},
        ${index++},
        ${input.tx.json({ source: "bug_report" })}::jsonb
      )
    `;
  }
}

export async function createBugReportAction(formData: FormData): Promise<ActionResult<{ id: string; reportNumber: string }>> {
  const parsed = createBugReportSchema.safeParse({
    title: formDataString(formData, "title"),
    description: formDataString(formData, "description"),
    expectedBehavior: formDataString(formData, "expectedBehavior"),
    actualBehavior: formDataString(formData, "actualBehavior"),
    reproductionSteps: formDataJson<string[]>(formData, "reproductionSteps", []),
    sourceArea: formDataString(formData, "sourceArea") || "booking",
    sourceUrl: formDataString(formData, "sourceUrl"),
    severity: formDataString(formData, "severity") || "medium",
    priority: formDataString(formData, "priority") || "normal",
    bookingId: formDataString(formData, "bookingId"),
    providerId: formDataString(formData, "providerId"),
    serviceId: formDataString(formData, "serviceId"),
    specialistId: formDataString(formData, "specialistId"),
    guestName: formDataString(formData, "guestName"),
    guestEmail: formDataString(formData, "guestEmail"),
    guestPhoneCountryCode: formDataString(formData, "guestPhoneCountryCode"),
    guestPhone: formDataString(formData, "guestPhone"),
    browserName: formDataString(formData, "browserName"),
    operatingSystem: formDataString(formData, "operatingSystem"),
    deviceType: formDataString(formData, "deviceType"),
    appVersion: formDataString(formData, "appVersion"),
    environment: formDataJson<Record<string, unknown>>(formData, "environment", {}),
  });

  if (!parsed.success) {
    return { ok: false, message: "Please complete the required fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const userId = await resolveCurrentUserId();
  const customerId = await resolveCurrentCustomerId();
  const files = getBugReportFilesFromFormData(formData);

  try {
    const result = await sql.begin(async (tx) => {
      const attachments = await storeBugReportFiles({ files, createdByUserId: userId, tx });
      const data = parsed.data;
      const conversationRows = await tx<{ id: string; conversation_number: string }[]>`
        insert into support.conversations (
          customer_user_id,
          customer_id,
          guest_name,
          guest_email,
          guest_phone_country_code,
          guest_phone,
          source,
          source_url,
          locale,
          status,
          priority,
          metadata
        ) values (
          ${userId ? tx`${userId}::uuid` : null},
          ${customerId ? tx`${customerId}::uuid` : null},
          ${data.guestName},
          ${data.guestEmail},
          ${data.guestPhoneCountryCode},
          ${data.guestPhone},
          ${supportConversationSource(data.sourceArea)},
          ${data.sourceUrl},
          ${formDataString(formData, "locale") || "en-US"},
          'open',
          ${data.priority},
          ${tx.json({ kind: "bug_report", sourceArea: data.sourceArea, environment: data.environment })}::jsonb
        )
        returning id, conversation_number
      `;

      const conversationId = conversationRows[0].id;
      const bugRows = await tx<{ id: string; report_number: string }[]>`
        insert into support.bug_reports (
          conversation_id,
          title,
          description,
          expected_behavior,
          actual_behavior,
          reproduction_steps,
          source_area,
          source_url,
          booking_id,
          provider_id,
          service_id,
          specialist_id,
          customer_user_id,
          customer_id,
          guest_name,
          guest_email,
          guest_phone_country_code,
          guest_phone,
          severity,
          priority,
          browser_name,
          operating_system,
          device_type,
          app_version,
          environment,
          metadata
        ) values (
          ${conversationId}::uuid,
          ${data.title},
          ${data.description},
          ${data.expectedBehavior},
          ${data.actualBehavior},
          ${tx.json(data.reproductionSteps)}::jsonb,
          ${data.sourceArea},
          ${data.sourceUrl},
          ${data.bookingId ? tx`${data.bookingId}::uuid` : null},
          ${data.providerId ? tx`${data.providerId}::uuid` : null},
          ${data.serviceId ? tx`${data.serviceId}::uuid` : null},
          ${data.specialistId ? tx`${data.specialistId}::uuid` : null},
          ${userId ? tx`${userId}::uuid` : null},
          ${customerId ? tx`${customerId}::uuid` : null},
          ${data.guestName},
          ${data.guestEmail},
          ${data.guestPhoneCountryCode},
          ${data.guestPhone},
          ${data.severity},
          ${data.priority},
          ${data.browserName},
          ${data.operatingSystem},
          ${data.deviceType},
          ${data.appVersion},
          ${tx.json(data.environment)}::jsonb,
          ${tx.json({ createdFrom: "customer_bug_report_page" })}::jsonb
        )
        returning id, report_number
      `;

      const messageRows = await tx<{ id: string }[]>`
        insert into support.messages (
          conversation_id,
          sender_type,
          sender_user_id,
          body,
          body_json,
          message_type,
          is_internal_note,
          attachments,
          metadata
        ) values (
          ${conversationId}::uuid,
          'customer',
          ${userId ? tx`${userId}::uuid` : null},
          ${buildInitialMessage(data)},
          ${tx.json({ title: data.title, expectedBehavior: data.expectedBehavior, actualBehavior: data.actualBehavior, reproductionSteps: data.reproductionSteps })}::jsonb,
          ${attachments.length > 0 ? (attachments.some((item) => item.mediaType === "file") ? "file" : "image") : "text"},
          false,
          ${tx.json(attachments)}::jsonb,
          ${tx.json({ bugReportId: bugRows[0].id })}::jsonb
        )
        returning id
      `;

      await insertBugReportMedia({ tx, bugReportId: bugRows[0].id, messageId: messageRows[0].id, attachments });

      await tx`
        insert into support.conversation_events (conversation_id, actor_user_id, event_type, to_value, metadata)
        values (${conversationId}::uuid, ${userId ? tx`${userId}::uuid` : null}, 'bug_created', ${bugRows[0].report_number}, ${tx.json({ bugReportId: bugRows[0].id, public: true })}::jsonb)
      `;

      await queueBugReportUpdateNotifications({
        tx,
        bugReportId: bugRows[0].id,
        conversationId,
        eventType: 'bug_created',
        actorUserId: userId,
        title: `New bug report: ${data.title}`,
        body: `${bugRows[0].report_number} was submitted by ${data.guestName || data.guestEmail || 'a customer'}.`,
        notifyCustomer: false,
        notifyAdmins: true,
        payload: { sourceArea: data.sourceArea, severity: data.severity, priority: data.priority },
      });

      return { id: bugRows[0].id, reportNumber: bugRows[0].report_number };
    });

    revalidatePath("/n/app/mobile/bug-reports");
    revalidatePath("/admin/bug-reports");
    return { ok: true, data: result, message: "Bug report submitted." };
  } catch (error) {
    console.error("createBugReportAction failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not submit bug report." };
  }
}

export async function addAdminBugReportMessageAction(formData: FormData): Promise<ActionResult<{ messageId: string }>> {
  const userId = await resolveCurrentUserId();
  if (!userId) return { ok: false, message: "Authentication required." };

  const parsed = adminBugReportMessageSchema.safeParse({
    bugReportId: formDataString(formData, "bugReportId"),
    body: formDataString(formData, "body"),
    isInternalNote: formDataBoolean(formData, "isInternalNote"),
    nextStatus: formDataString(formData, "nextStatus") || undefined,
    path: formDataString(formData, "path"),
  });

  if (!parsed.success) return { ok: false, message: "Please write a valid message.", fieldErrors: fieldErrors(parsed.error) };

  try {
    const files = getBugReportFilesFromFormData(formData);
    const result = await sql.begin(async (tx) => {
      const bug = await tx<{ id: string; conversation_id: string; title: string; report_number: string }[]>`
        select id, conversation_id, title, report_number
        from support.bug_reports
        where id = ${parsed.data.bugReportId}::uuid and deleted_at is null
        limit 1
      `;
      if (!bug[0]) throw new Error("Bug report not found.");

      const attachments = await storeBugReportFiles({ files, createdByUserId: userId, tx });
      const rows = await tx<{ id: string }[]>`
        insert into support.messages (
          conversation_id,
          sender_type,
          sender_user_id,
          body,
          body_json,
          message_type,
          is_internal_note,
          attachments,
          metadata
        ) values (
          ${bug[0].conversation_id}::uuid,
          'agent',
          ${userId}::uuid,
          ${parsed.data.body},
          ${tx.json({})}::jsonb,
          ${parsed.data.isInternalNote ? "note" : attachments.length > 0 ? "file" : "text"},
          ${parsed.data.isInternalNote},
          ${tx.json(attachments)}::jsonb,
          ${tx.json({ bugReportId: bug[0].id })}::jsonb
        )
        returning id
      `;

      await insertBugReportMedia({ tx, bugReportId: bug[0].id, messageId: rows[0].id, attachments });

      await tx`
        insert into support.conversation_events (conversation_id, actor_user_id, event_type, to_value, metadata)
        values (
          ${bug[0].conversation_id}::uuid,
          ${userId}::uuid,
          ${parsed.data.isInternalNote ? 'internal_note_added' : 'agent_replied'},
          ${rows[0].id},
          ${tx.json({ bugReportId: bug[0].id, messageId: rows[0].id, public: !parsed.data.isInternalNote })}::jsonb
        )
      `;

      await queueBugReportUpdateNotifications({
        tx,
        bugReportId: bug[0].id,
        conversationId: bug[0].conversation_id,
        eventType: parsed.data.isInternalNote ? 'internal_note_added' : 'agent_replied',
        actorUserId: userId,
        title: parsed.data.isInternalNote ? `Internal note added: ${bug[0].report_number}` : `Reply from LSevin support: ${bug[0].report_number}`,
        body: parsed.data.isInternalNote ? 'An internal note was added to this bug report.' : parsed.data.body,
        messageId: rows[0].id,
        internalOnly: parsed.data.isInternalNote,
        notifyCustomer: !parsed.data.isInternalNote,
        notifyAdmins: true,
      });

      if (parsed.data.nextStatus) {
        await tx`
          update support.bug_reports
          set status = ${parsed.data.nextStatus},
              resolved_by_user_id = case when ${parsed.data.nextStatus} in ('resolved','closed','duplicate','wont_fix') then ${userId}::uuid else resolved_by_user_id end
          where id = ${bug[0].id}::uuid
        `;
        await tx`
          update support.conversations
          set status = ${conversationStatusForBugStatus(parsed.data.nextStatus)}
          where id = ${bug[0].conversation_id}::uuid
        `;
        await tx`
          insert into support.conversation_events (conversation_id, actor_user_id, event_type, to_value, metadata)
          values (${bug[0].conversation_id}::uuid, ${userId}::uuid, 'status_changed', ${parsed.data.nextStatus}, ${tx.json({ bugReportId: bug[0].id, public: true })}::jsonb)
        `;
        await queueBugReportUpdateNotifications({
          tx,
          bugReportId: bug[0].id,
          conversationId: bug[0].conversation_id,
          eventType: 'status_changed',
          actorUserId: userId,
          title: `Bug status changed: ${bug[0].report_number}`,
          body: `Status changed to ${parsed.data.nextStatus.replace(/_/g, ' ')}.`,
          status: parsed.data.nextStatus,
          notifyCustomer: !parsed.data.isInternalNote,
          notifyAdmins: true,
        });
      }

      return { messageId: rows[0].id };
    });

    revalidatePath(parsed.data.path || `/admin/bug-reports/${parsed.data.bugReportId}`);
    revalidatePath("/admin/bug-reports");
    return { ok: true, data: result, message: "Message added." };
  } catch (error) {
    console.error("addAdminBugReportMessageAction failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not add message." };
  }
}

export async function addCustomerBugReportReplyAction(formData: FormData): Promise<ActionResult<{ messageId: string }>> {
  const userId = await resolveCurrentUserId();
  const customerId = await resolveCurrentCustomerId();
  if (!userId && !customerId) return { ok: false, message: "Please login to reply to this bug report." };

  const parsed = customerBugReportReplySchema.safeParse({
    bugReportId: formDataString(formData, "bugReportId"),
    body: formDataString(formData, "body"),
    path: formDataString(formData, "path"),
  });

  if (!parsed.success) return { ok: false, message: "Please write a valid reply.", fieldErrors: fieldErrors(parsed.error) };

  try {
    const files = getBugReportFilesFromFormData(formData);
    const result = await sql.begin(async (tx) => {
      const ownershipWhere = buildCustomerBugReportOwnershipWhere(tx, { userId, customerId });
      const bug = await tx<{ id: string; conversation_id: string; title: string; report_number: string }[]>`
        select id, conversation_id, title, report_number
        from support.bug_reports
        where id = ${parsed.data.bugReportId}::uuid
          and ${ownershipWhere}
          and deleted_at is null
        limit 1
      `;
      if (!bug[0]) throw new Error("Bug report not found.");

      const attachments = await storeBugReportFiles({ files, createdByUserId: userId, tx });
      const rows = await tx<{ id: string }[]>`
        insert into support.messages (
          conversation_id,
          sender_type,
          sender_user_id,
          body,
          body_json,
          message_type,
          is_internal_note,
          attachments,
          metadata
        ) values (
          ${bug[0].conversation_id}::uuid,
          'customer',
          ${userId ? tx`${userId}::uuid` : null},
          ${parsed.data.body},
          ${tx.json({})}::jsonb,
          ${attachments.length > 0 ? "file" : "text"},
          false,
          ${tx.json(attachments)}::jsonb,
          ${tx.json({ bugReportId: bug[0].id })}::jsonb
        )
        returning id
      `;

      await insertBugReportMedia({ tx, bugReportId: bug[0].id, messageId: rows[0].id, attachments });
      await tx`
        update support.bug_reports
        set status = case when status in ('resolved','closed','duplicate','wont_fix') then 'open' else status end
        where id = ${bug[0].id}::uuid
      `;
      await tx`
        update support.conversations
        set status = 'open'
        where id = ${bug[0].conversation_id}::uuid
      `;
      await tx`
        insert into support.conversation_events (conversation_id, actor_user_id, event_type, to_value, metadata)
        values (
          ${bug[0].conversation_id}::uuid,
          ${userId ? tx`${userId}::uuid` : null},
          'customer_replied',
          ${rows[0].id},
          ${tx.json({ bugReportId: bug[0].id, messageId: rows[0].id, public: true })}::jsonb
        )
      `;
      await queueBugReportUpdateNotifications({
        tx,
        bugReportId: bug[0].id,
        conversationId: bug[0].conversation_id,
        eventType: 'customer_replied',
        actorUserId: userId,
        title: `Customer replied: ${bug[0].report_number}`,
        body: parsed.data.body,
        messageId: rows[0].id,
        notifyCustomer: false,
        notifyAdmins: true,
      });
      return { messageId: rows[0].id };
    });

    revalidatePath(parsed.data.path || "/n/app/mobile/bug-reports");
    revalidatePath("/admin/bug-reports");
    return { ok: true, data: result, message: "Reply added." };
  } catch (error) {
    console.error("addCustomerBugReportReplyAction failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not add reply." };
  }
}

export async function updateBugReportStatusAction(formData: FormData): Promise<ActionResult<{ status: BugReportStatus }>> {
  const userId = await resolveCurrentUserId();
  if (!userId) return { ok: false, message: "Authentication required." };

  const parsed = updateBugReportStatusSchema.safeParse({
    bugReportId: formDataString(formData, "bugReportId"),
    status: formDataString(formData, "status"),
    resolutionNote: formDataString(formData, "resolutionNote"),
    path: formDataString(formData, "path"),
  });

  if (!parsed.success) return { ok: false, message: "Invalid status.", fieldErrors: fieldErrors(parsed.error) };

  try {
    await sql.begin(async (tx) => {
      const rows = await tx<{ conversation_id: string; status: BugReportStatus; report_number: string }[]>`
        select conversation_id, status, report_number
        from support.bug_reports
        where id = ${parsed.data.bugReportId}::uuid
          and deleted_at is null
        limit 1
      `;
      if (!rows[0]) throw new Error("Bug report not found.");

      await tx`
        update support.bug_reports
        set status = ${parsed.data.status},
            resolution_note = coalesce(${parsed.data.resolutionNote}, resolution_note),
            resolved_by_user_id = case when ${parsed.data.status} in ('resolved','closed','duplicate','wont_fix') then ${userId}::uuid else resolved_by_user_id end
        where id = ${parsed.data.bugReportId}::uuid
      `;
      await tx`
        update support.conversations
        set status = ${conversationStatusForBugStatus(parsed.data.status)},
            unread_for_customer_count = unread_for_customer_count + 1
        where id = ${rows[0].conversation_id}::uuid
      `;
      await tx`
        insert into support.conversation_events (conversation_id, actor_user_id, event_type, from_value, to_value, metadata)
        values (${rows[0].conversation_id}::uuid, ${userId}::uuid, 'status_changed', ${rows[0].status}, ${parsed.data.status}, ${tx.json({ bugReportId: parsed.data.bugReportId, public: true })}::jsonb)
      `;
      await queueBugReportUpdateNotifications({
        tx,
        bugReportId: parsed.data.bugReportId,
        conversationId: rows[0].conversation_id,
        eventType: 'status_changed',
        actorUserId: userId,
        title: `Bug status changed: ${rows[0].report_number}`,
        body: parsed.data.resolutionNote || `Status changed from ${rows[0].status.replace(/_/g, ' ')} to ${parsed.data.status.replace(/_/g, ' ')}.`,
        status: parsed.data.status,
        notifyCustomer: true,
        notifyAdmins: true,
      });
    });

    revalidatePath(parsed.data.path || `/admin/bug-reports/${parsed.data.bugReportId}`);
    revalidatePath("/admin/bug-reports");
    return { ok: true, data: { status: parsed.data.status }, message: "Status updated." };
  } catch (error) {
    console.error("updateBugReportStatusAction failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not update status." };
  }
}

export async function assignBugReportAction(formData: FormData): Promise<ActionResult<{ assignedToUserId: string | null }>> {
  const userId = await resolveCurrentUserId();
  if (!userId) return { ok: false, message: "Authentication required." };

  const parsed = assignBugReportSchema.safeParse({
    bugReportId: formDataString(formData, "bugReportId"),
    assignedToUserId: formDataString(formData, "assignedToUserId"),
    path: formDataString(formData, "path"),
  });

  if (!parsed.success) return { ok: false, message: "Invalid assignee.", fieldErrors: fieldErrors(parsed.error) };

  try {
    await sql.begin(async (tx) => {
      const rows = await tx<{ conversation_id: string; assigned_to_user_id: string | null; report_number: string }[]>`
        select conversation_id, assigned_to_user_id, report_number
        from support.bug_reports
        where id = ${parsed.data.bugReportId}::uuid and deleted_at is null
        limit 1
      `;
      if (!rows[0]) throw new Error("Bug report not found.");

      if (parsed.data.assignedToUserId) {
        await tx`
          update support.bug_reports
          set assigned_to_user_id = ${parsed.data.assignedToUserId}::uuid
          where id = ${parsed.data.bugReportId}::uuid
        `;
        await tx`
          update support.conversations
          set assigned_to_user_id = ${parsed.data.assignedToUserId}::uuid
          where id = ${rows[0].conversation_id}::uuid
        `;
      } else {
        await tx`
          update support.bug_reports
          set assigned_to_user_id = null
          where id = ${parsed.data.bugReportId}::uuid
        `;
        await tx`
          update support.conversations
          set assigned_to_user_id = null
          where id = ${rows[0].conversation_id}::uuid
        `;
      }
      await tx`
        insert into support.conversation_events (conversation_id, actor_user_id, event_type, from_value, to_value, metadata)
        values (${rows[0].conversation_id}::uuid, ${userId}::uuid, 'assignee_changed', ${rows[0].assigned_to_user_id}, ${parsed.data.assignedToUserId}, ${tx.json({ bugReportId: parsed.data.bugReportId, public: false })}::jsonb)
      `;
      await queueBugReportUpdateNotifications({
        tx,
        bugReportId: parsed.data.bugReportId,
        conversationId: rows[0].conversation_id,
        eventType: 'assignee_changed',
        actorUserId: userId,
        title: `Bug assignment changed: ${rows[0].report_number}`,
        body: parsed.data.assignedToUserId ? 'This bug report was assigned to an agent.' : 'This bug report was unassigned.',
        internalOnly: true,
        notifyCustomer: false,
        notifyAdmins: true,
      });
    });

    revalidatePath(parsed.data.path || `/admin/bug-reports/${parsed.data.bugReportId}`);
    revalidatePath("/admin/bug-reports");
    return { ok: true, data: { assignedToUserId: parsed.data.assignedToUserId }, message: "Assignment updated." };
  } catch (error) {
    console.error("assignBugReportAction failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not assign bug report." };
  }
}

export async function archiveBugReportAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const userId = await resolveCurrentUserId();
  if (!userId) return { ok: false, message: "Authentication required." };

  const bugReportId = formDataString(formData, "bugReportId");
  const path = formDataString(formData, "path");
  if (!bugReportId) return { ok: false, message: "Bug report id is required." };

  try {
    await sql.begin(async (tx) => {
      const rows = await tx<{ conversation_id: string; report_number: string }[]>`
        select conversation_id, report_number from support.bug_reports where id = ${bugReportId}::uuid limit 1
      `;
      if (!rows[0]) throw new Error("Bug report not found.");
      await tx`update support.bug_reports set deleted_at = now() where id = ${bugReportId}::uuid`;
      await tx`update support.conversations set status = 'archived' where id = ${rows[0].conversation_id}::uuid`;
      await tx`
        insert into support.conversation_events (conversation_id, actor_user_id, event_type, metadata)
        values (${rows[0].conversation_id}::uuid, ${userId}::uuid, 'bug_archived', ${tx.json({ bugReportId, public: false })}::jsonb)
      `;
      await queueBugReportUpdateNotifications({
        tx,
        bugReportId,
        conversationId: rows[0].conversation_id,
        eventType: 'bug_archived',
        actorUserId: userId,
        title: `Bug archived: ${rows[0].report_number}`,
        body: 'This bug report was archived.',
        internalOnly: true,
        notifyCustomer: false,
        notifyAdmins: true,
      });
    });
    revalidatePath(path || "/admin/bug-reports");
    return { ok: true, data: { id: bugReportId }, message: "Bug report archived." };
  } catch (error) {
    console.error("archiveBugReportAction failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not archive bug report." };
  }
}
