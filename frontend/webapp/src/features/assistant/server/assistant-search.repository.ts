import "server-only";

import sql from "@/config/database/db";
import { resolveDisplayPrice } from "@/features/finance/lib/server/toman-price";

import type { AssistantServiceResult, SearchServicesToolOutput } from "../types";

// Anchored UUID regex used inside SQL: image columns often store media.media_library ids.
const uuidPattern = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

const MAX_TERM_LENGTH = 120;

/** A piece of SQL built with sql`...`, nested into a bigger query. */
type Fragment = ReturnType<typeof sql.unsafe>;

/**
 * Words that describe *where* or *who* rather than the treatment itself. They are dropped from
 * the query, so "hair transplant clinic" or "کلینیک کاشت مو" still find the treatment by name.
 */
const STOP_WORDS = new Set([
  // English
  "a", "an", "the", "in", "at", "for", "of", "and", "or", "with", "near", "me", "best", "top", "good", "cheap",
  "clinic", "clinics", "clinique", "cliniques", "doctor", "doctors", "dr", "specialist", "specialists",
  "center", "centre", "centers", "centres", "hospital", "hospitals", "treatment", "treatments", "service", "services",
  // Persian
  "در", "برای", "و", "با", "از", "به", "کلینیک", "کلینیک های", "کلینیکهای", "مرکز", "مراکز", "دکتر", "پزشک",
  "متخصص", "بیمارستان", "بهترین", "خوب", "ارزان", "خدمات",
  // Arabic, Turkish, Russian
  "في", "عيادة", "طبيب", "مركز", "klinik", "doktor", "merkez", "клиника", "врач", "центр", "в",
]);

/** Same folding as the SQL `fold()` below: Arabic yeh/kaf to Persian, ZWNJ to space, lower case. */
export function foldText(value: string): string {
  return value
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‎‏]/g, " ")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * The query as a whole phrase and as its meaningful words, ready for LIKE against fold() text.
 * Each must start a word (the leading space), so "fue" does not match Spanish "esfuerzo" and
 * "مو" does not match "رموش"; it may still be followed by more letters ("موی", "transplantation").
 */
export function buildMatchTerms(query: string): { phrase: string; patterns: string[] } | null {
  const folded = foldText(query.slice(0, MAX_TERM_LENGTH)).replace(/[-_/+.,،؛;:!?؟()"'«»]/g, " ");
  const allWords = folded.split(" ").filter(Boolean);
  const words = allWords.filter((word) => !STOP_WORDS.has(word));
  const kept = words.length ? words : allWords;
  if (!kept.length) return null;

  return {
    phrase: `% ${escapeLike(kept.join(" "))}%`,
    patterns: Array.from(new Set(kept)).map((word) => `% ${escapeLike(word)}%`),
  };
}

/** service_providers.country holds ISO codes (IR, TR, AE, OM); the assistant passes names. */
const COUNTRY_CODES: Record<string, string> = {
  iran: "ir", ایران: "ir",
  turkey: "tr", turkiye: "tr", türkiye: "tr", ترکیه: "tr",
  uae: "ae", emirates: "ae", unitedarabemirates: "ae", امارات: "ae",
  oman: "om", عمان: "om",
};

/**
 * service_providers.city holds lower/upper-case English slugs, some cut short ("bandar-ab",
 * "khorramsh"). Persian names and common spellings are mapped to the slug without separators.
 */
const CITY_SLUGS: Record<string, string> = {
  تهران: "tehran", مشهد: "mashhad", شیراز: "shiraz", اصفهان: "isfahan", esfahan: "isfahan", کاشان: "kashan",
  دبی: "dubai", استانبول: "istanbul", اهواز: "ahvaz", رشت: "rasht", یزد: "yazd", گرگان: "gorgan",
  مسقط: "muscat", تبریز: "tabriz", خرمشهر: "khorramshahr", گنبدکاووس: "gonbadekavus", gonbadkavus: "gonbadekavus",
  gonbad: "gonbadekavus", ساری: "sari", بابل: "babol", کرمان: "kerman", ابوظبی: "abudhabi",
  بندرعباس: "bandarabbas", ارومیه: "orumiyeh", urmia: "orumiyeh", قم: "qom", رامسر: "ramsar", چابهار: "chabahar",
  آبادان: "abadan", انزلی: "bandareanzali", بندرانزلی: "bandareanzali", anzali: "bandareanzali",
  bandaranzali: "bandareanzali", محمودآباد: "mahmudabad", کرج: "karaj",
};

const withoutSeparators = (value: string) => foldText(value).replace(/[\s\-_.'’]/g, "");

export function toCountryKey(value: string): string {
  const key = withoutSeparators(value);
  return COUNTRY_CODES[key] ?? key;
}

export function toCitySlug(value: string): string {
  const key = withoutSeparators(value);
  return CITY_SLUGS[key] ?? key;
}

export type AssistantSearchKind = "all" | "clinics" | "doctors";

type ClinicRow = {
  id: string;
  name: string | null;
  provider: string | null;
  location: string;
  rating: number | null;
  reviews: number | null;
  price: number | null;
  currency: string | null;
  value_toman: number | null;
  image: string | null;
  total: number;
};

type DoctorRow = {
  id: string;
  name: string | null;
  specialty: string | null;
  provider: string | null;
  location: string;
  rating: number | null;
  reviews: number | null;
  price: number | null;
  currency: string | null;
  image: string | null;
  total: number;
};

const toNumber = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * The assistant's own catalogue search. Unlike the site search (which also matches descriptions,
 * category names and any text on a clinic, so "hair transplant" brings back unrelated services),
 * a result here must carry the treatment in its *name*:
 * - clinics: an active service whose name (in any language) or tag contains every word of the query.
 *   One card per clinic, for its best matching service, so a clinic never appears twice.
 * - doctors: linked to a matching service, or with the treatment in their specialty.
 * Matches on the whole phrase rank above matches on separate words, then rating and reviews decide.
 */
type SearchInput = {
  /** One or more names for the same treatment (e.g. English and Persian); a result needs to match one. */
  queries: string[];
  locale: string;
  isIranianVisitor: boolean;
  city?: string | null;
  country?: string | null;
  kind?: AssistantSearchKind;
  clinicLimit: number;
  doctorLimit: number;
};

/** Searches the catalogue; when nothing matches in the requested place, returns the matches elsewhere. */
export async function searchAssistantCatalogue(input: SearchInput): Promise<SearchServicesToolOutput> {
  const result = await searchCatalogue(input);
  const place = [input.city, input.country].filter((value) => value?.trim()).join(", ");
  if (!place || result.results.length) return result;

  const elsewhere = await searchCatalogue({ ...input, city: null, country: null });
  return elsewhere.results.length ? { ...elsewhere, noMatchesIn: place } : result;
}

async function searchCatalogue(input: SearchInput): Promise<SearchServicesToolOutput> {
  const termSets = input.queries
    .map(buildMatchTerms)
    .filter((terms): terms is NonNullable<typeof terms> => terms !== null);
  if (!termSets.length) return { clinicCount: 0, doctorCount: 0, results: [] };

  const kind = input.kind ?? "all";
  const city = input.city?.trim() ? toCitySlug(input.city) : null;
  const country = input.country?.trim() ? toCountryKey(input.country) : null;

  // fold(): the SQL twin of foldText, with punctuation as spaces and a leading space so every
  // word, including the first, starts after a space. The query side is folded in JS already.
  const fold = (column: Fragment) =>
    sql`(' ' || regexp_replace(lower(translate(${column}, ${"يىك‌"}, ${"ییک "})), '[-_/(),.:;،+"«»]', ' ', 'g'))`;
  // Matching only looks at English, Persian and the user's own language: other translations
  // (Spanish especially) are full of short words that look like the query.
  const languages = Array.from(new Set(["en", "fa", input.locale.slice(0, 2).toLowerCase()]));
  // Every text value of a translations column in those languages, whether it is a
  // {lang: text} object or a plain string.
  const values = (column: Fragment) => sql`
    (
      SELECT e.key, e.value
      FROM jsonb_each_text(CASE jsonb_typeof(${column})
        WHEN 'object' THEN ${column}
        WHEN 'string' THEN jsonb_build_object('v', ${column} #>> '{}')
        ELSE '{}'::jsonb END) e
      WHERE e.key = 'v' OR split_part(lower(e.key), '-', 1) = ANY (${languages}::text[])
    )
  `;
  // 2 = the whole phrase appears, 1 = every word appears (any order), 0 = no match.
  const scoreFor = (text: Fragment, terms: (typeof termSets)[number]) => sql`
    CASE
      WHEN ${fold(text)} LIKE ${terms.phrase} THEN 2
      WHEN ${fold(text)} LIKE ALL (${terms.patterns}::text[]) THEN 1
      ELSE 0
    END
  `;
  // The best score over all the names the treatment was searched by.
  const score = (text: Fragment) =>
    sql`GREATEST(${termSets
      .slice(1)
      .reduce((list, terms) => sql`${list}, ${scoreFor(text, terms)}`, scoreFor(text, termSets[0]))})`;
  const image = (column: Fragment) => sql`
    CASE
      WHEN BTRIM(split_part(${column}, ',', 1)) ~* ${uuidPattern} THEN (
        SELECT NULLIF(BTRIM(ml.file_url), '') FROM media.media_library ml
        WHERE ml.id = BTRIM(split_part(${column}, ',', 1))::uuid
      )
      ELSE NULLIF(BTRIM(split_part(${column}, ',', 1)), '')
    END
  `;
  const placeFilter = sql`
    (
      ${city}::text IS NULL
      OR regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g') = ${city}
      -- Cut-short slugs ("bandar-ab") match the full name ("bandarabbas").
      OR (
        length(regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g')) >= 7
        AND ${city}::text LIKE regexp_replace(lower(sp.city), '[^a-z0-9]', '', 'g') || '%'
      )
    )
    AND (${country}::text IS NULL OR regexp_replace(lower(sp.country), '[^a-z]', '', 'g') = ${country})
  `;

  const matchingDefinitions = sql`
    SELECT sd.id, MAX(${score(sql`t.value`)}) AS score
    FROM category.service_definitions sd
    JOIN category.categories c ON c.id = sd.category_id AND c.is_active = true
    CROSS JOIN LATERAL ${values(sql`sd.name_translations`)} t
    WHERE sd.is_active = true
    GROUP BY sd.id
    HAVING MAX(${score(sql`t.value`)}) > 0
  `;

  const matchingServices = sql`
    SELECT ps.id, ps.service_provider_id, GREATEST(COALESCE(md.score, 0), COALESCE(own.score, 0)) AS score
    FROM category.provider_services ps
    JOIN category.service_definitions sd ON sd.id = ps.service_definition_id AND sd.is_active = true
    JOIN category.categories c ON c.id = sd.category_id AND c.is_active = true
    JOIN category.service_providers sp ON sp.id = ps.service_provider_id AND sp.is_active = true
    LEFT JOIN matching_definitions md ON md.id = sd.id
    LEFT JOIN LATERAL (
      SELECT MAX(${score(sql`name.value`)}) AS score
      FROM (
        SELECT value FROM ${values(sql`ps.display_name_translations`)} display_name
        UNION ALL
        SELECT unnest(COALESCE(ps.tags, ARRAY[]::text[]))
      ) name(value)
    ) own ON true
    WHERE ps.is_active = true
      AND ${placeFilter}
      AND GREATEST(COALESCE(md.score, 0), COALESCE(own.score, 0)) > 0
  `;

  const [clinicRows, doctorRows] = await Promise.all([
    kind === "doctors"
      ? Promise.resolve([] as ClinicRow[])
      : sql<ClinicRow[]>`
        WITH matching_definitions AS (${matchingDefinitions}),
        matching_services AS (${matchingServices}),
        best_per_clinic AS (
          SELECT DISTINCT ON (ps.service_provider_id)
            ps.id, ps.service_provider_id, ms.score,
            COALESCE(ps.rating, sp.rating, 0)::float8 AS rating,
            COALESCE(ps.review_count, sp.review_count, 0)::int AS reviews
          FROM matching_services ms
          JOIN category.provider_services ps ON ps.id = ms.id
          JOIN category.service_providers sp ON sp.id = ps.service_provider_id
          ORDER BY ps.service_provider_id, ms.score DESC, ps.is_featured DESC,
            COALESCE(ps.rating, 0) DESC, ps.value ASC
        ),
        ranked AS (
          SELECT b.*, COUNT(*) OVER ()::int AS total
          FROM best_per_clinic b
          ORDER BY b.score DESC, b.rating * ln(2 + b.reviews) DESC, b.reviews DESC
          LIMIT ${input.clinicLimit}
        )
        SELECT
          ps.id::text AS id,
          COALESCE(
            NULLIF(common.get_translation_t(ps.display_name_translations, ${input.locale}::text, 'en-US'), ''),
            common.get_translation_t(sd.name_translations, ${input.locale}::text, 'en-US')
          ) AS name,
          common.get_translation_t(sp.name_translations, ${input.locale}::text, 'en-US') AS provider,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          r.rating,
          r.reviews,
          ps.value::float8 AS price,
          ps.currency,
          ps.value_toman::float8 AS value_toman,
          COALESCE(
            ${image(sql`ps.image_url`)},
            (
              SELECT ${image(sql`g.url`)}
              FROM category.provider_service_gallery_items g
              WHERE g.provider_service_id = ps.id
              ORDER BY g.is_primary DESC, g.display_order ASC, g.create_date DESC
              LIMIT 1
            ),
            ${image(sql`sp.image_url`)}
          ) AS image,
          r.total
        FROM ranked r
        JOIN category.provider_services ps ON ps.id = r.id
        JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
        JOIN category.service_providers sp ON sp.id = ps.service_provider_id
        ORDER BY r.score DESC, r.rating * ln(2 + r.reviews) DESC, r.reviews DESC
      `,
    kind === "clinics"
      ? Promise.resolve([] as DoctorRow[])
      : sql<DoctorRow[]>`
        WITH matching_definitions AS (${matchingDefinitions}),
        matching_services AS (${matchingServices}),
        doctor_scores AS (
          SELECT staff_id, MAX(score) AS score
          FROM (
            SELECT ss.staff_id, md.score
            FROM category.staff_services ss
            JOIN matching_definitions md ON md.id = ss.service_definition_id
            WHERE ss.is_active = true
            UNION ALL
            SELECT st.id, ${score(sql`st.specialty`)}
            FROM category.staff st
            WHERE st.specialty IS NOT NULL
            UNION ALL
            SELECT st.id, ${score(sql`t.value`)}
            FROM category.staff st
            CROSS JOIN LATERAL ${values(sql`st.specialty_translations`)} t
            UNION ALL
            SELECT sz.staff_id, ${score(sql`sz.specialty`)}
            FROM category.staff_specializations sz
          ) scores
          GROUP BY staff_id
          HAVING MAX(score) > 0
        ),
        -- A doctor can work at several clinics: show the one that offers the treatment, if any.
        doctor_clinic AS (
          SELECT DISTINCT ON (st.id)
            st.id, sp.id AS provider_id, ds.score,
            COALESCE(st.rating, 0)::float8 AS rating,
            COALESCE(st.review_count, 0)::int AS reviews
          FROM doctor_scores ds
          JOIN category.staff st ON st.id = ds.staff_id AND st.is_active = true
          JOIN category.provider_staffs psf ON psf.staff_id = st.id AND psf.is_active = true
          JOIN category.service_providers sp ON sp.id = psf.service_provider_id AND sp.is_active = true
          WHERE ${placeFilter}
          ORDER BY st.id,
            EXISTS (SELECT 1 FROM matching_services ms WHERE ms.service_provider_id = sp.id) DESC,
            COALESCE(sp.rating, 0) DESC
        ),
        ranked AS (
          SELECT d.*, COUNT(*) OVER ()::int AS total
          FROM doctor_clinic d
          ORDER BY d.score DESC, d.rating * ln(2 + d.reviews) DESC, d.reviews DESC
          LIMIT ${input.doctorLimit}
        )
        SELECT
          st.id::text AS id,
          common.get_translation_t(st.name_translations, ${input.locale}::text, 'en-US') AS name,
          COALESCE(
            NULLIF(common.get_translation_t(st.specialty_translations, ${input.locale}::text, 'en-US'), ''),
            NULLIF(BTRIM(st.specialty), '')
          ) AS specialty,
          common.get_translation_t(sp.name_translations, ${input.locale}::text, 'en-US') AS provider,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          r.rating,
          r.reviews,
          COALESCE(st.consultation_fee, 0)::float8 AS price,
          (
            SELECT ps.currency FROM category.provider_services ps
            WHERE ps.service_provider_id = sp.id AND ps.is_active = true
            ORDER BY ps.value ASC
            LIMIT 1
          ) AS currency,
          COALESCE(
            ${image(sql`st.profile_image_url`)},
            (
              SELECT ${image(sql`g.url`)}
              FROM category.staff_gallery_items g
              WHERE g.staff_id = st.id AND COALESCE(NULLIF(BTRIM(g.media_type), ''), 'image') = 'image'
              ORDER BY g.is_primary DESC, g.display_order ASC, g.create_date DESC
              LIMIT 1
            )
          ) AS image,
          r.total
        FROM ranked r
        JOIN category.staff st ON st.id = r.id
        JOIN category.service_providers sp ON sp.id = r.provider_id
        ORDER BY r.score DESC, r.rating * ln(2 + r.reviews) DESC, r.reviews DESC
      `,
  ]);

  const clinics: AssistantServiceResult[] = clinicRows.map((row) => {
    const price = resolveDisplayPrice(
      { value: toNumber(row.price), currency: row.currency || "USD" },
      row.value_toman,
      input.isIranianVisitor
    );
    return {
      id: row.id,
      type: "service",
      name: row.name || "",
      provider: row.provider || "",
      location: row.location || "",
      rating: toNumber(row.rating),
      reviews: toNumber(row.reviews),
      price: price.value,
      currency: price.currency,
      image: row.image || "",
      href: `/n/app/mobile/service/${row.id}`,
    };
  });

  const doctors: AssistantServiceResult[] = doctorRows.map((row) => ({
    id: row.id,
    type: "specialist",
    name: row.name || "",
    provider: [row.specialty, row.provider].filter(Boolean).join(" · "),
    location: row.location || "",
    rating: toNumber(row.rating),
    reviews: toNumber(row.reviews),
    price: toNumber(row.price),
    currency: row.currency || "USD",
    image: row.image || "",
    href: `/n/app/mobile/specialist/${row.id}`,
  }));

  return {
    clinicCount: clinicRows[0]?.total ?? 0,
    doctorCount: doctorRows[0]?.total ?? 0,
    results: [...clinics, ...doctors],
  };
}
