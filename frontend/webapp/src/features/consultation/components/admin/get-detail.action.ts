"use server";

import { getTranslations } from "next-intl/server";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { getConsultationRequestDetail } from "../../server/repository";
import {
  CONSULTATION_TRANSLATION_KEY,
  type ConsultationActionResult,
  type ConsultationRequestDetail,
} from "../../types";

/**
 * The detail drawer needs the notification log, which the list query deliberately
 * rolls up to three counters rather than shipping in full for every row.
 *
 * Like every other export of a `"use server"` module this is a public POST endpoint
 * addressed by action id, so it re-establishes the caller's role instead of trusting
 * that the page it is called from was itself gated.
 */
export async function getConsultationRequestDetailAction(input: {
  id: string;
}): Promise<ConsultationActionResult<ConsultationRequestDetail>> {
  await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);

  const id = typeof input?.id === "string" ? input.id.trim() : "";

  // Checked here rather than left to Postgres: `where id = $1::uuid` throws a
  // 22P02 on anything that is not a uuid, which would surface as a 500 instead of
  // the "gone" message the panel wants to show.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { ok: false, error: t("errors.notFound") };
  }

  const detail = await getConsultationRequestDetail(id);
  if (!detail) return { ok: false, error: t("errors.notFound") };

  return { ok: true, data: detail };
}
