import { NextRequest, NextResponse } from "next/server";

import sql from "@/config/database/db";

type LazySelectOption = {
  value: string;
  label: string;
  description?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  meta?: Record<string, unknown>;
};

const FALLBACK_LOCALE = "en-US";
const MAX_LIMIT = 50;

function normalizeLocale(value: string | null) {
  return value && value.trim() ? value.trim() : FALLBACK_LOCALE;
}

function normalizeQuery(value: string | null) {
  return value?.trim() || "";
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value || 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(parsed)));
}

function normalizeSelected(value: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 100);
}

function localizedText(columnExpression: string, locale: string) {
  const column = sql.unsafe(columnExpression);
  return sql`common.get_translation_t(
    case
      when jsonb_typeof(${column}) = 'object' then ${column}
      else '{}'::jsonb
    end,
    ${locale},
    ${FALLBACK_LOCALE}
  )`;
}

function selectedClause(columnExpression: string, selected: string[]) {
  if (!selected.length) return sql``;
  return sql`or ${sql.unsafe(columnExpression)} in ${sql(selected)}`;
}

function staticSearch(items: LazySelectOption[], q: string, selected: string[], limit: number) {
  const normalized = q.toLowerCase();
  const selectedSet = new Set(selected);

  return items
    .filter((item) => {
      if (selectedSet.has(item.value)) return true;
      if (!normalized) return true;
      return [item.label, item.description, item.badge, item.value]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    })
    .slice(0, limit);
}

async function serviceProviders(locale: string, q: string, selected: string[], limit: number): Promise<LazySelectOption[]> {
  const like = `%${q}%`;
  return sql<LazySelectOption[]>`
    select
      sp.id::text as value,
      ${localizedText("sp.name_translations", locale)} as label,
      concat_ws(' • ', nullif(${localizedText("pt.name_translations", locale)}, ''), nullif(sp.country, ''), nullif(sp.city, '')) as description,
      case when sp.is_active then 'Active' else 'Inactive' end as badge,
      sp.image_url as "imageUrl",
      jsonb_build_object(
        'country', sp.country,
        'city', sp.city,
        'isActive', sp.is_active,
        'providerTypeId', sp.provider_type_id::text
      ) as meta
    from category.service_providers sp
    left join category.provider_types pt on pt.id = sp.provider_type_id
    where
      ${q} = ''
      or ${localizedText("sp.name_translations", locale)} ilike ${like}
      or ${localizedText("pt.name_translations", locale)} ilike ${like}
      or coalesce(sp.country, '') ilike ${like}
      or coalesce(sp.city, '') ilike ${like}
      ${selectedClause("sp.id::text", selected)}
    order by sp.is_active desc, label asc
    limit ${limit}
  `;
}

async function serviceDefinitions(locale: string, q: string, selected: string[], limit: number): Promise<LazySelectOption[]> {
  const like = `%${q}%`;
  return sql<LazySelectOption[]>`
    select
      sd.id::text as value,
      ${localizedText("sd.name_translations", locale)} as label,
      concat_ws(' • ', nullif(${localizedText("c.name_translations", locale)}, ''), sd.duration_minutes::text || ' min') as description,
      concat(sd.value::text, ' ', sd.currency) as badge,
      null::text as "imageUrl",
      jsonb_build_object(
        'categoryId', sd.category_id::text,
        'durationMinutes', sd.duration_minutes,
        'pricingModel', sd.pricing_model,
        'currency', sd.currency,
        'value', sd.value,
        'isActive', sd.is_active
      ) as meta
    from category.service_definitions sd
    join category.categories c on c.id = sd.category_id
    where
      ${q} = ''
      or ${localizedText("sd.name_translations", locale)} ilike ${like}
      or ${localizedText("sd.description_translations", locale)} ilike ${like}
      or ${localizedText("c.name_translations", locale)} ilike ${like}
      or coalesce(sd.pricing_model, '') ilike ${like}
      or coalesce(sd.currency, '') ilike ${like}
      ${selectedClause("sd.id::text", selected)}
    order by sd.is_active desc, label asc
    limit ${limit}
  `;
}

async function availabilityStatuses(q: string, selected: string[], limit: number): Promise<LazySelectOption[]> {
  const like = `%${q}%`;
  return sql<LazySelectOption[]>`
    select
      sas.id::text as value,
      sas.name as label,
      'Availability status'::text as description,
      null::text as badge,
      null::text as "imageUrl",
      jsonb_build_object('id', sas.id) as meta
    from category.staff_availability_statuses sas
    where
      ${q} = ''
      or sas.name ilike ${like}
      ${selectedClause("sas.id::text", selected)}
    order by sas.id asc
    limit ${limit}
  `;
}

const DAYS_OF_WEEK: LazySelectOption[] = [
  { value: "Monday", label: "Monday", description: "Day 1" },
  { value: "Tuesday", label: "Tuesday", description: "Day 2" },
  { value: "Wednesday", label: "Wednesday", description: "Day 3" },
  { value: "Thursday", label: "Thursday", description: "Day 4" },
  { value: "Friday", label: "Friday", description: "Day 5" },
  { value: "Saturday", label: "Saturday", description: "Day 6" },
  { value: "Sunday", label: "Sunday", description: "Day 7" },
];

const GALLERY_MEDIA_TYPES: LazySelectOption[] = [
  { value: "image", label: "Image", description: "Photo or static image" },
  { value: "video", label: "Video", description: "Video media" },
  { value: "gif", label: "GIF", description: "Animated image" },
  { value: "file", label: "File", description: "Document or downloadable file" },
];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const resource = params.get("resource") || "";
    const q = normalizeQuery(params.get("q"));
    const locale = normalizeLocale(params.get("locale"));
    const selected = normalizeSelected(params.get("selected"));
    const limit = normalizeLimit(params.get("limit"));

    let items: LazySelectOption[] = [];

    switch (resource) {
      case "serviceProviders":
        items = await serviceProviders(locale, q, selected, limit);
        break;
      case "serviceDefinitions":
        items = await serviceDefinitions(locale, q, selected, limit);
        break;
      case "staffAvailabilityStatuses":
      case "availabilityStatuses":
        items = await availabilityStatuses(q, selected, limit);
        break;
      case "daysOfWeek":
        items = staticSearch(DAYS_OF_WEEK, q, selected, limit);
        break;
      case "staffGalleryMediaTypes":
      case "mediaTypes":
        items = staticSearch(GALLERY_MEDIA_TYPES, q, selected, limit);
        break;
      default:
        return NextResponse.json({ items: [], error: `Unsupported lazy select resource: ${resource}` }, { status: 400 });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/lazy-search-options]", error);
    return NextResponse.json(
      { items: [], error: error instanceof Error ? error.message : "Lazy select lookup failed." },
      { status: 500 }
    );
  }
}
