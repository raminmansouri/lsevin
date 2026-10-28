"use server";

import { headers } from "next/headers";
import { z } from "zod/v4";

import db from "@/config/database/db";
import { getSession } from "@/lib/auth/session";

import { canJoinSession, type VideoSessionStatus } from "../doctor-panel-types";
import type { ConsultationActionResult } from "../types";

const SessionIdSchema = z.uuid();

/** The signed-in user's side of a session, or null when it isn't theirs. */
async function callRole(userId: string, sessionId: string) {
  const rows = await db<
    { role: "doctor" | "patient" | null; status: VideoSessionStatus; scheduledAt: Date; durationMinutes: number }[]
  >`
    select case
             when vd.user_id = ${userId}::uuid then 'doctor'
             when s.patient_user_id = ${userId}::uuid then 'patient'
           end as role,
           s.status, s.scheduled_at as "scheduledAt", s.duration_minutes as "durationMinutes"
    from consultation.video_sessions s
    join consultation.video_doctors vd on vd.id = s.doctor_id
    where s.id = ${sessionId}::uuid
  `;
  const row = rows[0];
  return row?.role ? row : null;
}

/**
 * Records being in the call room: "join" when connected (returns the visit's
 * id), "heartbeat" every minute while connected, "leave" on the way out.
 */
export async function recordCallPresenceAction(
  sessionId: string,
  event: "join" | "heartbeat" | "leave",
  visitId?: string
): Promise<ConsultationActionResult<{ id: string }>> {
  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "forbidden" };
  const id = SessionIdSchema.safeParse(sessionId);
  if (!id.success) return { ok: false, error: "notFound" };

  try {
    if (event === "join") {
      const call = await callRole(userId, id.data);
      if (!call) return { ok: false, error: "forbidden" };
      const item = {
        status: call.status,
        scheduledAt: new Date(call.scheduledAt).toISOString(),
        durationMinutes: call.durationMinutes,
      };
      if (!canJoinSession(item)) return { ok: false, error: "notJoinable" };
      const rows = await db<{ id: string }[]>`
        insert into consultation.video_session_attendance (session_id, role, user_id)
        values (${id.data}::uuid, ${call.role}, ${userId}::uuid)
        returning id::text as id
      `;
      return { ok: true, data: { id: rows[0].id } };
    }

    const visit = SessionIdSchema.safeParse(visitId);
    if (!visit.success) return { ok: false, error: "notFound" };
    const rows = await db<{ id: string }[]>`
      update consultation.video_session_attendance
         set last_seen_at = now(),
             left_at = case when ${event === "leave"} then now() else left_at end
       where id = ${visit.data}::uuid
         and session_id = ${id.data}::uuid
         and user_id = ${userId}::uuid
         and left_at is null
      returning id::text as id
    `;
    return rows[0] ? { ok: true, data: { id: rows[0].id } } : { ok: false, error: "notFound" };
  } catch (error) {
    console.error("[consultation] call presence failed", error);
    return { ok: false, error: "loadFailed" };
  }
}

const CallProblemSchema = z.object({
  problem: z.enum(["unreachable", "error"]),
  /** What the browser knows about its own network; free text, kept short. */
  network: z.string().max(40).optional(),
  message: z.string().max(300).optional(),
});

/**
 * Logs a call that couldn't reach the call server, with what we know about
 * the visitor's network, so failures can be traced to operators from real
 * traffic. One JSON line per report, prefixed for grepping the server logs.
 */
export async function reportCallProblemAction(
  sessionId: string,
  report: { problem: "unreachable" | "error"; network?: string; message?: string }
): Promise<ConsultationActionResult<null>> {
  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "forbidden" };
  const id = SessionIdSchema.safeParse(sessionId);
  const parsed = CallProblemSchema.safeParse(report);
  if (!id.success || !parsed.success) return { ok: false, error: "notFound" };

  try {
    const call = await callRole(userId, id.data);
    if (!call) return { ok: false, error: "forbidden" };
    const h = await headers();
    console.error(
      "[consultation][call-problem]",
      JSON.stringify({
        at: new Date().toISOString(),
        sessionId: id.data,
        userId,
        role: call.role,
        problem: parsed.data.problem,
        network: parsed.data.network ?? null,
        message: parsed.data.message ?? null,
        ip: h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        country: h.get("x-country") ?? null,
        userAgent: h.get("user-agent") ?? null,
      })
    );
    return { ok: true, data: null };
  } catch (error) {
    console.error("[consultation] call problem report failed", error);
    return { ok: false, error: "loadFailed" };
  }
}
