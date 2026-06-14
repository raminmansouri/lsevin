import { NextResponse } from "next/server";
import db from "@/config/database/db";

type LazyResourceConfig = {
  from: string;
  valueExpression: string;
  labelExpression: (locale: string) => string;
  descriptionExpression?: (locale: string) => string;
  badgeExpression?: string;
  imageExpression?: string;
  searchExpression?: (locale: string) => string;
  where?: string;
  orderBy?: string;
};

function sqlStringLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function translation(column: string, locale: string) {
  return `common.get_translation_t(${column}, ${sqlStringLiteral(locale)}, 'en-US')`;
}

const RESOURCES: Record<string, LazyResourceConfig> = {
  service_definitions: {
    from: "category.service_definitions sd",
    valueExpression: "sd.id::text",
    labelExpression: (locale) => translation("sd.name_translations", locale),
    descriptionExpression: (locale) => translation("sd.description_translations", locale),
    badgeExpression: "sd.booking_ui_mode",
    searchExpression: (locale) => `${translation("sd.name_translations", locale)} || ' ' || ${translation("sd.description_translations", locale)} || ' ' || sd.id::text`,
    where: "sd.is_active = true",
    orderBy: "sd.last_modified_date desc nulls last, sd.create_date desc",
  },
  provider_services: {
    from: "category.provider_services ps",
    valueExpression: "ps.id::text",
    labelExpression: (locale) => translation("ps.display_name_translations", locale),
    descriptionExpression: (locale) => translation("ps.description_translations", locale),
    imageExpression: "ps.image_url",
    searchExpression: (locale) => `${translation("ps.display_name_translations", locale)} || ' ' || ${translation("ps.description_translations", locale)} || ' ' || ps.id::text`,
    where: "ps.is_active = true",
    orderBy: "ps.last_modified_date desc nulls last, ps.create_date desc",
  },
  service_providers: {
    from: "category.service_providers sp",
    valueExpression: "sp.id::text",
    labelExpression: (locale) => translation("sp.name_translations", locale),
    descriptionExpression: () => "concat_ws(' — ', sp.email, sp.phone_number)",
    imageExpression: "sp.image_url",
    searchExpression: (locale) => `${translation("sp.name_translations", locale)} || ' ' || coalesce(sp.email, '') || ' ' || coalesce(sp.phone_number, '') || ' ' || sp.id::text`,
    where: "sp.is_active = true",
    orderBy: "sp.last_modified_date desc nulls last, sp.create_date desc",
  },
  staff: {
    from: "category.staff st left join media.media_library st_profile_media on st_profile_media.id::text = nullif(btrim(st.profile_image_url), '')",
    valueExpression: "st.id::text",
    labelExpression: (locale) => translation("st.name_translations", locale),
    descriptionExpression: (locale) => `nullif(${translation("st.title_translations", locale)}, '')`,
    imageExpression: "coalesce(nullif(btrim(st_profile_media.file_url), ''), case when nullif(btrim(st.profile_image_url), '') is not null and nullif(btrim(st.profile_image_url), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(st.profile_image_url), '') end)",
    searchExpression: (locale) => `${translation("st.name_translations", locale)} || ' ' || ${translation("st.title_translations", locale)} || ' ' || coalesce(st.specialty, '') || ' ' || st.id::text`,
    where: "st.is_active = true",
    orderBy: "st.last_modified_date desc nulls last, st.create_date desc",
  },
  categories: {
    from: "category.categories c",
    valueExpression: "c.id::text",
    labelExpression: (locale) => translation("c.name_translations", locale),
    descriptionExpression: (locale) => translation("c.description_translations", locale),
    imageExpression: "coalesce(c.image_url, c.icon_url)",
    searchExpression: (locale) => `${translation("c.name_translations", locale)} || ' ' || ${translation("c.description_translations", locale)} || ' ' || c.id::text`,
    where: "c.is_active = true",
    orderBy: "c.display_order asc, c.last_modified_date desc nulls last",
  },
  provider_types: {
    from: "category.provider_types pt",
    valueExpression: "pt.id::text",
    labelExpression: (locale) => translation("pt.name_translations", locale),
    descriptionExpression: (locale) => translation("pt.description_translations", locale),
    imageExpression: "coalesce(pt.image_url, pt.icon_url)",
    searchExpression: (locale) => `${translation("pt.name_translations", locale)} || ' ' || ${translation("pt.description_translations", locale)} || ' ' || pt.id::text`,
    where: "pt.is_active = true",
    orderBy: "pt.last_modified_date desc nulls last, pt.create_date desc",
  },
  addons: {
    from: "category.addons a",
    valueExpression: "a.id",
    labelExpression: () => "a.name",
    descriptionExpression: () => "concat(a.price::text, ' ', a.currency_code)",
    badgeExpression: "a.addon_kind",
    searchExpression: () => "a.id || ' ' || a.name || ' ' || coalesce(a.description, '')",
    where: "a.is_active = true",
    orderBy: "a.name asc",
  },
  locations: {
    from: "category.locations l",
    valueExpression: "l.id::text",
    labelExpression: (locale) => `concat(l.code, ' — ', ${translation("l.value_translations", locale)})`,
    badgeExpression: "l.location_type_id::text",
    searchExpression: (locale) => `l.code || ' ' || ${translation("l.value_translations", locale)} || ' ' || l.id::text`,
    orderBy: "l.display_order asc nulls last, l.code asc",
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || "";
  const config = RESOURCES[resource];

  if (!config) {
    return NextResponse.json({ items: [], error: "Unsupported lazy-select resource" }, { status: 400 });
  }

  const q = (searchParams.get("q") || "").trim();
  const locale = (searchParams.get("locale") || "fa-IR").replace(/_/g, "-").slice(0, 10);
  const selected = (searchParams.get("selected") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));

  const label = config.labelExpression(locale);
  const description = config.descriptionExpression?.(locale) ?? "null::text";
  const badge = config.badgeExpression ?? "null::text";
  const image = config.imageExpression ?? "null::text";
  const search = config.searchExpression?.(locale) ?? label;
  const where = config.where ? `and (${config.where})` : "";
  const orderBy = config.orderBy ?? "label asc";

  const rows = await db.unsafe(
    `
      select
        ${config.valueExpression} as value,
        coalesce(nullif(${label}, ''), ${config.valueExpression}) as label,
        nullif(${description}, '') as description,
        nullif(${badge}, '') as badge,
        nullif(${image}, '') as "imageUrl"
      from ${config.from}
      where true
        ${where}
        and (
          $1 = ''
          or (${search}) ilike ('%' || $1 || '%')
          or (${config.valueExpression}) = any($2::text[])
        )
      order by
        case when (${config.valueExpression}) = any($2::text[]) then 0 else 1 end,
        ${orderBy}
      limit $3
    `,
    [q, selected, limit]
  );

  return NextResponse.json({ items: rows });
}
