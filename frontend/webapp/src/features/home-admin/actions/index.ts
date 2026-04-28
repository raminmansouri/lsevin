'use server';

import { revalidatePath } from 'next/cache';

import sql from '@/config/database/db';

import { HomeSectionFormSchema, type HomeSectionFormInput } from './schema';

function translations(value: HomeSectionFormInput['title']) {
  return value?.translations && typeof value.translations === 'object' ? value.translations : {};
}

export async function upsertHomeSectionAction(input: HomeSectionFormInput) {
  const data = HomeSectionFormSchema.parse(input);
  const metadata = JSON.parse(data.metadata || '{}') as Record<string, unknown>;

  await sql`
    insert into marketing.home_sections (
      section_key,
      badge_translations,
      title_translations,
      subtitle_translations,
      description_translations,
      button_label_translations,
      button_href,
      image_url,
      icon_name,
      display_order,
      is_active,
      metadata
    )
    values (
      ${data.sectionKey},
      ${sql.json(translations(data.badge))}::jsonb,
      ${sql.json(translations(data.title))}::jsonb,
      ${sql.json(translations(data.subtitle))}::jsonb,
      ${sql.json(translations(data.description))}::jsonb,
      ${sql.json(translations(data.buttonLabel))}::jsonb,
      ${data.buttonHref || null},
      ${data.imageUrl || null},
      ${data.iconName || null},
      ${data.displayOrder},
      ${data.isActive},
      ${sql.json(metadata)}::jsonb
    )
    on conflict (section_key) do update set
      badge_translations = excluded.badge_translations,
      title_translations = excluded.title_translations,
      subtitle_translations = excluded.subtitle_translations,
      description_translations = excluded.description_translations,
      button_label_translations = excluded.button_label_translations,
      button_href = excluded.button_href,
      image_url = excluded.image_url,
      icon_name = excluded.icon_name,
      display_order = excluded.display_order,
      is_active = excluded.is_active,
      metadata = excluded.metadata,
      updated_at = now()
  `;

  revalidatePath('/admin/home-sections');
  revalidatePath('/n/app/mobile/home');

  return { ok: true, sectionKey: data.sectionKey };
}
