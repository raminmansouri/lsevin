import "server-only";

import sql from "@/config/database/db";
import {
  AUTH_ONBOARDING_STEP_CONTENT_TYPE,
  AUTH_PAGE_CONTENT_TYPE,
} from "@/features/auth-content/lib/auth-content.constants";
import {
  type AuthContentAdminDetails,
  type AuthContentAdminListItem,
  type JsonRecord,
  type TranslationMap,
} from "@/features/auth-content/types/auth-content.types";
import { pickTranslation } from "@/features/auth/db/auth-content.queries";

type AuthContentAdminRow = {
  id: string;
  type_code: string;
  item_key: string | null;
  media_url: string | null;
  media_kind: "image" | "video" | "gif" | "file";
  eyebrow_translations: TranslationMap | null;
  title_translations: TranslationMap | null;
  subtitle_translations: TranslationMap | null;
  body_translations: TranslationMap | null;
  button_title_translations: TranslationMap | null;
  button_url: string | null;
  alt_translations: TranslationMap | null;
  display_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  style: JsonRecord | null;
  metadata: JsonRecord | null;
  last_modified_date: string;
};

export async function getAdminAuthContentItems(
  locale: string,
): Promise<AuthContentAdminListItem[]> {
  const rows = await sql<AuthContentAdminRow[]>`
    select
      i.id,
      t.code as type_code,
      i.item_key,
      nullif(i.media_url, 'about:blank') as media_url,
      i.media_kind,
      i.eyebrow_translations,
      i.title_translations,
      i.subtitle_translations,
      i.body_translations,
      i.button_title_translations,
      i.button_url,
      i.alt_translations,
      i.display_order,
      i.is_active,
      i.open_in_new_tab,
      i.style,
      i.metadata,
      i.last_modified_date::text
    from common.app_content_items i
    inner join common.app_content_types t on t.id = i.type_id
    where t.code in (${AUTH_PAGE_CONTENT_TYPE}, ${AUTH_ONBOARDING_STEP_CONTENT_TYPE})
    order by t.display_order asc, i.display_order asc, i.create_date desc
  `;

  return rows.map((row) => ({
    id: row.id,
    typeCode: row.type_code,
    itemKey: row.item_key || "",
    title: pickTranslation(row.title_translations, locale) || "Untitled",
    subtitle: pickTranslation(row.subtitle_translations, locale),
    mediaUrl: row.media_url,
    displayOrder: Number(row.display_order || 0),
    isActive: row.is_active,
    lastModifiedDate: row.last_modified_date,
  }));
}

export async function getAdminAuthContentItem(
  id: string,
): Promise<AuthContentAdminDetails | null> {
  const rows = await sql<AuthContentAdminRow[]>`
    select
      i.id,
      t.code as type_code,
      i.item_key,
      nullif(i.media_url, 'about:blank') as media_url,
      i.media_kind,
      i.eyebrow_translations,
      i.title_translations,
      i.subtitle_translations,
      i.body_translations,
      i.button_title_translations,
      i.button_url,
      i.alt_translations,
      i.display_order,
      i.is_active,
      i.open_in_new_tab,
      i.style,
      i.metadata,
      i.last_modified_date::text
    from common.app_content_items i
    inner join common.app_content_types t on t.id = i.type_id
    where i.id = ${id}
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    typeCode: row.type_code,
    itemKey: row.item_key || "",
    mediaUrl: row.media_url,
    mediaKind: row.media_kind,
    eyebrow: row.eyebrow_translations || {},
    title: row.title_translations || {},
    subtitle: row.subtitle_translations || {},
    body: row.body_translations || {},
    buttonTitle: row.button_title_translations || {},
    buttonUrl: row.button_url,
    alt: row.alt_translations || {},
    displayOrder: Number(row.display_order || 0),
    isActive: row.is_active,
    openInNewTab: row.open_in_new_tab,
    style: row.style || {},
    metadata: row.metadata || {},
  };
}
