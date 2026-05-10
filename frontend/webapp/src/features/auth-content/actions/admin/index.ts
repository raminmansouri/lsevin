"use server";

import { revalidatePath } from "next/cache";

import sql from "@/config/database/db";
import {
  AUTH_ONBOARDING_STEP_CONTENT_TYPE,
  AUTH_PAGE_CONTENT_TYPE,
} from "@/features/auth-content/lib/auth-content.constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { parseJsonObject } from "../../lib/localized";
import {
  saveAuthContentItemSchema,
  type SaveAuthContentItemInput,
} from "../../schemas/admin-auth-content.schemas";

const problem = (title: string, status = 500, detail?: string) => ({
  title,
  status,
  detail,
});

function nullableString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function ensureAuthContentType(typeCode: string) {
  const existing = await sql<{ id: number }[]>`
    select id
    from common.app_content_types
    where code = ${typeCode}
    limit 1
  `;

  if (existing[0]) return existing[0].id;

  const label =
    typeCode === AUTH_ONBOARDING_STEP_CONTENT_TYPE
      ? "Auth onboarding step"
      : "Auth page";

  const inserted = await sql<{ id: number }[]>`
    insert into common.app_content_types (
      id,
      code,
      name_translations,
      description_translations,
      display_order,
      is_active
    )
    values (
      (select coalesce(max(id), 0) + 1 from common.app_content_types),
      ${typeCode},
      ${sql.json({ "en-US": label })},
      ${sql.json({ "en-US": "Configurable authentication page content." })},
      ${typeCode === AUTH_PAGE_CONTENT_TYPE ? 900 : 901},
      true
    )
    returning id
  `;

  return inserted[0].id;
}

function buildMetadata(input: SaveAuthContentItemInput) {
  const metadata = parseJsonObject(input.metadataJson);
  const secondaryButtonTitle = nullableString(input.secondaryButtonTitle);
  const secondaryButtonUrl = nullableString(input.secondaryButtonUrl);

  if (secondaryButtonTitle) {
    const current =
      metadata.secondaryButtonTitleTranslations &&
      typeof metadata.secondaryButtonTitleTranslations === "object" &&
      !Array.isArray(metadata.secondaryButtonTitleTranslations)
        ? (metadata.secondaryButtonTitleTranslations as Record<string, string>)
        : {};

    metadata.secondaryButtonTitleTranslations = {
      ...current,
      [input.locale]: secondaryButtonTitle,
    };
  }

  if (secondaryButtonUrl) {
    metadata.secondaryButtonUrl = secondaryButtonUrl;
  }

  return metadata;
}

async function handler(
  input: SaveAuthContentItemInput,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes,
) {
  try {
    const typeId = await ensureAuthContentType(input.typeCode);
    const metadata = buildMetadata(input);
    const style = parseJsonObject(input.styleJson);

    const mediaUrl = nullableString(input.mediaUrl) || "about:blank";
    const buttonUrl = nullableString(input.buttonUrl);

    if (input.id) {
      const updated = await sql<{ id: string }[]>`
        update common.app_content_items
           set type_id = ${typeId},
               item_key = ${input.itemKey.trim()},
               media_url = ${mediaUrl},
               media_kind = ${input.mediaKind},
               eyebrow_translations = ${sql.json(input.eyebrow)},
               title_translations = ${sql.json(input.title)},
               subtitle_translations = ${sql.json(input.subtitle)},
               body_translations = ${sql.json(input.body)},
               button_title_translations = ${sql.json(input.buttonTitle)},
               button_url = ${buttonUrl},
               alt_translations = ${sql.json(input.alt)},
               display_order = ${input.displayOrder},
               is_active = ${input.isActive},
               open_in_new_tab = ${input.openInNewTab},
               metadata = ${sql.json(metadata)},
               style = ${sql.json(style)},
               last_modified_date = now()
         where id = ${input.id}
         returning id
      `;

      if (!updated[0]) {
        return {
          data: undefined,
          error: problem("Auth content item was not found.", 404),
          payload: input,
        };
      }

      revalidatePath("/admin/auth-content");
      revalidatePath("/sign-in");
      revalidatePath("/sign-up");
      revalidatePath("/forgot-password");
      revalidatePath("/on-boarding");

      return { data: updated[0].id, payload: input };
    }

    const inserted = await sql<{ id: string }[]>`
      insert into common.app_content_items (
        type_id,
        item_key,
        media_url,
        media_kind,
        eyebrow_translations,
        title_translations,
        subtitle_translations,
        body_translations,
        button_title_translations,
        button_url,
        alt_translations,
        display_order,
        is_active,
        open_in_new_tab,
        metadata,
        style
      )
      values (
        ${typeId},
        ${input.itemKey.trim()},
        ${mediaUrl},
        ${input.mediaKind},
        ${sql.json(input.eyebrow)},
        ${sql.json(input.title)},
        ${sql.json(input.subtitle)},
        ${sql.json(input.body)},
        ${sql.json(input.buttonTitle)},
        ${buttonUrl},
        ${sql.json(input.alt)},
        ${input.displayOrder},
        ${input.isActive},
        ${input.openInNewTab},
        ${sql.json(metadata)},
        ${sql.json(style)}
      )
      returning id
    `;

    revalidatePath("/admin/auth-content");
    revalidatePath("/sign-in");
    revalidatePath("/sign-up");
    revalidatePath("/forgot-password");
    revalidatePath("/on-boarding");

    return { data: inserted[0].id, payload: input };
  } catch (error) {
    const detail = error instanceof Error ? error.message : undefined;
    return {
      data: undefined,
      error: problem("Could not save auth content item.", 500, detail),
      payload: input,
    };
  }
}

export const saveAuthContentItemAction = createAuthenticatedSafeAction(
  saveAuthContentItemSchema,
  handler,
  { adminRequired: true },
);
