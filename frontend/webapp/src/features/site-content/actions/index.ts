"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod/v4";

import sql from "@/config/database/db";
import { getAdminContext } from "@/lib/auth/admin-guard";

import { SITE_CONTENT_TAG } from "../server/repository";
import type { FaqScope } from "../types";
import { FaqFormSchema, SitePageFormSchema, filledLocales, type FaqFormInput, type SitePageFormInput } from "./schema";

export type EditorialActionFailure = {
  ok: false;
  code: "INVALID" | "FORBIDDEN" | "NOT_FOUND" | "FAILED";
  message: string;
  fieldErrors?: Record<string, string>;
};

export type EditorialActionResult<T = undefined> = { ok: true; data: T } | EditorialActionFailure;

const invalid = (error: z.ZodError) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return {
    ok: false as const,
    code: "INVALID" as const,
    message: error.issues[0]?.message ?? "Check the highlighted fields.",
    fieldErrors,
  };
};

// Audit column only: a session id that is not a GUID must not fail the save.
const auditUser = (userId?: string) => (userId && z.guid().safeParse(userId).success ? userId : null);

const forbidden = { ok: false as const, code: "FORBIDDEN" as const, message: "Forbidden." };

/** Only locales with real text: an emptied editor tab must not count as a translation. */
const translations = (value: { translations?: Record<string, string> } | undefined) => {
  const all = value?.translations && typeof value.translations === "object" ? value.translations : {};
  return Object.fromEntries(filledLocales(all).map((key) => [key, all[key].trim()]));
};

// Every editorial write changes public pages, the footer, the sitemap and llms.txt.
const revalidateSiteContent = () => revalidateTag(SITE_CONTENT_TAG);

/** Creates or updates one essential page (keyed by slug). Admin only. */
export async function saveSitePageAction(input: SitePageFormInput): Promise<EditorialActionResult<{ id: string }>> {
  const { isAdmin, userId } = await getAdminContext();
  if (!isAdmin) return forbidden;

  const parsed = SitePageFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const rows = await sql<{ id: string }[]>`
      insert into content.site_pages (
        slug, title_translations, summary_translations, body_translations,
        hero_media, is_published, show_in_footer, display_order, updated_by
      )
      values (
        ${data.slug},
        ${sql.json(translations(data.title))}::jsonb,
        ${sql.json(translations(data.summary))}::jsonb,
        ${sql.json(translations(data.body))}::jsonb,
        ${data.heroMedia},
        ${data.isPublished},
        ${data.showInFooter},
        ${data.displayOrder},
        ${auditUser(userId)}::uuid
      )
      on conflict (slug) do update set
        title_translations = excluded.title_translations,
        summary_translations = excluded.summary_translations,
        body_translations = excluded.body_translations,
        hero_media = excluded.hero_media,
        is_published = excluded.is_published,
        show_in_footer = excluded.show_in_footer,
        display_order = excluded.display_order,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning id::text as id
    `;
    revalidateSiteContent();
    return { ok: true, data: { id: rows[0].id } };
  } catch (error) {
    console.error("saveSitePageAction failed", { slug: data.slug, error });
    return { ok: false, code: "FAILED", message: "Could not save the page. Please try again." };
  }
}

const ENTITY_TABLE: Partial<Record<FaqScope, string>> = {
  provider: "category.service_providers",
  specialist: "category.staff",
  service: "category.provider_services",
  category: "category.categories",
  provider_type: "category.provider_types",
};

async function entityExists(scope: FaqScope, entityId: string) {
  const table = ENTITY_TABLE[scope];
  if (!table) return false;
  const rows = await sql<{ found: number }[]>`select 1 as found from ${sql(table)} where id::text = ${entityId} limit 1`;
  return rows.length > 0;
}

/** Creates (no id) or updates one FAQ item. Admin only. */
export async function saveFaqAction(input: FaqFormInput): Promise<EditorialActionResult<{ id: string }>> {
  const { isAdmin, userId } = await getAdminContext();
  if (!isAdmin) return forbidden;

  const parsed = FaqFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    if (data.entityId && !(await entityExists(data.scope, data.entityId))) {
      return { ok: false, code: "NOT_FOUND", message: "The selected item no longer exists." };
    }

    const question = sql.json(translations(data.question));
    const answer = sql.json(translations(data.answer));
    const rows = data.id
      ? await sql<{ id: string }[]>`
          update content.faq_items set
            scope = ${data.scope},
            entity_id = ${data.entityId}::uuid,
            entity_key = ${data.entityKey},
            question_translations = ${question}::jsonb,
            answer_translations = ${answer}::jsonb,
            display_order = ${data.displayOrder},
            is_active = ${data.isActive},
            updated_by = ${auditUser(userId)}::uuid,
            updated_at = now()
          where id::text = ${data.id}
          returning id::text as id
        `
      : await sql<{ id: string }[]>`
          insert into content.faq_items (
            scope, entity_id, entity_key, question_translations, answer_translations,
            display_order, is_active, updated_by
          )
          values (
            ${data.scope}, ${data.entityId}::uuid, ${data.entityKey}, ${question}::jsonb, ${answer}::jsonb,
            ${data.displayOrder}, ${data.isActive}, ${auditUser(userId)}::uuid
          )
          returning id::text as id
        `;
    if (!rows.length) return { ok: false, code: "NOT_FOUND", message: "This FAQ item no longer exists." };
    revalidateSiteContent();
    return { ok: true, data: { id: rows[0].id } };
  } catch (error) {
    console.error("saveFaqAction failed", { id: data.id ?? null, scope: data.scope, error });
    return { ok: false, code: "FAILED", message: "Could not save the FAQ item. Please try again." };
  }
}

const IdSchema = z.object({ id: z.guid() });

export async function deleteFaqAction(input: { id: string }): Promise<EditorialActionResult> {
  const { isAdmin } = await getAdminContext();
  if (!isAdmin) return forbidden;

  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const rows = await sql<{ id: string }[]>`
      delete from content.faq_items where id::text = ${parsed.data.id} returning id::text as id
    `;
    if (!rows.length) return { ok: false, code: "NOT_FOUND", message: "This FAQ item no longer exists." };
    revalidateSiteContent();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("deleteFaqAction failed", { id: parsed.data.id, error });
    return { ok: false, code: "FAILED", message: "Could not delete the FAQ item. Please try again." };
  }
}
