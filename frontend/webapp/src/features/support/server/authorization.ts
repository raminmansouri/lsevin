import "server-only";

import sql from "@/config/database/db";
import { getActiveGrant } from "@/features/patients/server/case-provider-repository";
import type { SupportConversationDetail } from "../types";

/**
 * Object-level authorization for the three realms that can now touch a
 * support conversation (migration 0064): the general-ticket rule (does
 * customerUserId match) still applies to context_type='general'; a
 * booking/consultation conversation additionally trusts the anchor
 * object's own owner before customerUserId gets backfilled onto it.
 */
export async function assertCustomerCanAccessConversation(conversation: SupportConversationDetail, accountId: string): Promise<void> {
  if (conversation.customerUserId === accountId) return;

  if (conversation.contextType === "booking" && conversation.bookingId) {
    const rows = await sql<{ userId: string | null }[]>`
      select user_id::text as "userId" from booking.bookings where id = ${conversation.bookingId}::uuid limit 1
    `;
    if (rows[0]?.userId === accountId) return;
  }

  if (conversation.contextType === "consultation" && conversation.consultationRequestId) {
    const rows = await sql<{ userId: string | null }[]>`
      select user_id::text as "userId" from consultation.consultation_requests where id = ${conversation.consultationRequestId}::uuid limit 1
    `;
    if (rows[0]?.userId === accountId) return;
  }

  throw new Error("FORBIDDEN");
}

/**
 * Provider-side authorization. If the conversation has a resolved medical
 * case, the existing patient.case_provider_grants row is the source of
 * truth (same primitive fulfillLabOrder/addProcedureToCase already check).
 * If only a booking is set (no case shared yet), the booking's own
 * assigned provider gets view access -- this is what lets a provider see
 * the thread and request a case share before any grant exists.
 */
export async function assertProviderCanAccessConversation(conversation: SupportConversationDetail, providerId: string): Promise<"view" | "contribute"> {
  if (conversation.medicalCaseId) {
    const grant = await getActiveGrant(conversation.medicalCaseId, providerId);
    if (grant) return grant.permission as "view" | "contribute";
  }

  if (conversation.contextType === "booking" && conversation.bookingId) {
    const rows = await sql<{ providerId: string | null }[]>`
      select provider_id::text as "providerId" from booking.bookings where id = ${conversation.bookingId}::uuid limit 1
    `;
    if (rows[0]?.providerId === providerId) return "view";
  }

  throw new Error("FORBIDDEN");
}
