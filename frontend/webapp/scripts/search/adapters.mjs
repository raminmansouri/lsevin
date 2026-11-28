/**
 * One adapter per searchable data type. To make new data searchable:
 *   1. add an adapter here (listIds + fetch),
 *   2. register it in `adapters` at the bottom,
 *   3. insert a row in search.sources and (optionally) a trigger that calls search.enqueue.
 * Nothing else changes: the schema, the API and the UI already handle any doc_type.
 *
 * fetch(sql, ids) returns one document per id that is still public. Ids that are missing
 * from the result (deleted, unpublished, inactive) are removed from the index.
 */
import { allValues, cleanTranslations, coords, fold, num, plainText, quality } from "./lib.mjs";

/** Prices are stored in the listing currency; search only shows/sorts Toman (1 toman = 10 rials). */
function toToman(amount, currency) {
  const n = num(amount);
  if (n === null) return null;
  const code = String(currency ?? "").toUpperCase();
  if (code === "IRR") return Math.round(n / 10);
  if (code === "IRT" || code === "TOMAN") return n;
  return null;
}

const lower = (value) => (value ? String(value).trim().toLowerCase() : null);

/** Fold every piece of text into one search string. */
function searchText(parts) {
  return fold(parts.flat().filter(Boolean).join(" "));
}

const provider = {
  type: "provider",
  async listIds(sql) {
    const rows = await sql`select id::text as id from category.service_providers where is_active and slug is not null`;
    return rows.map((row) => row.id);
  },
  async fetch(sql, ids) {
    const rows = await sql`
      select sp.id::text as id, sp.slug, sp.name_translations, sp.description_translations,
             sp.street_translations, sp.detail_translations, sp.city, sp.country, sp.latitude, sp.longitude,
             sp.rating, sp.review_count, sp.featured_score, sp.is_sponsored, sp.specialties, sp.image_url,
             (select jsonb_agg(sd.name_translations) from (
                select distinct sd.id, sd.name_translations
                  from category.provider_services ps
                  join category.service_definitions sd on sd.id = ps.service_definition_id
                 where ps.service_provider_id = sp.id and ps.is_active and sd.is_active
                 limit 40) sd) as service_names
        from category.service_providers sp
       where sp.is_active and sp.slug is not null and sp.id = any(${ids}::uuid[])`;
    return rows.map((row) => {
      const title = cleanTranslations(row.name_translations);
      const description = cleanTranslations(row.description_translations);
      const street = cleanTranslations(row.street_translations);
      const services = (row.service_names ?? []).map(cleanTranslations);
      const geo = coords(row.latitude, row.longitude);
      const city = lower(row.city);
      return {
        sourceId: row.id,
        title,
        subtitle: street,
        url: `/providers/${row.slug}`,
        image: row.image_url || null,
        city,
        country: lower(row.country),
        ...geo,
        priceToman: null,
        rating: num(row.rating),
        reviewCount: row.review_count ?? 0,
        quality: quality({ rating: row.rating, reviews: row.review_count, featured: num(row.featured_score) > 0, sponsored: row.is_sponsored }),
        serviceKey: null,
        providerId: row.id,
        attrs: {},
        text: searchText([
          allValues(title), allValues(description), allValues(street), allValues(cleanTranslations(row.detail_translations)),
          row.specialties ?? [], city, services.flatMap(allValues),
        ]),
        embedExtra: [
          ...services.slice(0, 12).map((names) => names["fa-IR"] ?? allValues(names)[0]),
          Object.values(description)[0]?.slice(0, 300),
        ],
      };
    });
  },
};

const offer = {
  type: "offer",
  async listIds(sql) {
    const rows = await sql`
      select ps.id::text as id
        from category.provider_services ps
        join category.service_providers sp on sp.id = ps.service_provider_id and sp.is_active
        join category.service_definitions sd on sd.id = ps.service_definition_id and sd.is_active
       where ps.is_active and ps.slug is not null`;
    return rows.map((row) => row.id);
  },
  async fetch(sql, ids) {
    const rows = await sql`
      select ps.id::text as id, ps.slug, ps.display_name_translations, ps.description_translations, ps.tags,
             ps.value_toman, ps.rating, ps.review_count, ps.is_featured, ps.is_popular, ps.image_url,
             sd.id::text as service_key, sd.name_translations as definition_names,
             sd.description_translations as definition_descriptions,
             sp.id::text as provider_id, sp.name_translations as provider_names, sp.city, sp.country,
             sp.latitude, sp.longitude, sp.is_sponsored, sp.street_translations, sp.image_url as provider_image
        from category.provider_services ps
        join category.service_providers sp on sp.id = ps.service_provider_id and sp.is_active
        join category.service_definitions sd on sd.id = ps.service_definition_id and sd.is_active
       where ps.is_active and ps.slug is not null and ps.id = any(${ids}::uuid[])`;
    return rows.map((row) => {
      const definition = cleanTranslations(row.definition_names);
      const display = cleanTranslations(row.display_name_translations);
      const title = Object.keys(display).length ? { ...definition, ...display } : definition;
      const providerNames = cleanTranslations(row.provider_names);
      const description = cleanTranslations(row.description_translations);
      const definitionDescription = cleanTranslations(row.definition_descriptions);
      const street = cleanTranslations(row.street_translations);
      const geo = coords(row.latitude, row.longitude);
      const city = lower(row.city);
      return {
        sourceId: row.id,
        title,
        subtitle: providerNames,
        url: `/services/${row.slug}`,
        image: row.image_url || row.provider_image || null,
        city,
        country: lower(row.country),
        ...geo,
        priceToman: num(row.value_toman),
        rating: num(row.rating),
        reviewCount: row.review_count ?? 0,
        quality: quality({ rating: row.rating, reviews: row.review_count, featured: row.is_featured || row.is_popular, sponsored: row.is_sponsored }),
        serviceKey: row.service_key,
        providerId: row.provider_id,
        attrs: { tags: row.tags ?? [] },
        text: searchText([
          allValues(title), allValues(definition), allValues(providerNames), allValues(description),
          allValues(definitionDescription), allValues(street), row.tags ?? [], city,
        ]),
        embedExtra: [Object.values(description)[0]?.slice(0, 300) ?? Object.values(definitionDescription)[0]?.slice(0, 300)],
      };
    });
  },
};

const tour = {
  type: "tour",
  async listIds(sql) {
    const rows = await sql`select id::text as id from tour.tours where status = 'published'`;
    return rows.map((row) => row.id);
  },
  async fetch(sql, ids) {
    const rows = await sql`
      select t.id::text as id, t.slug, t.rating_avg, t.review_count, t.is_featured, t.is_sponsored,
             t.from_price, t.currency_code, t.meeting_lat, t.meeting_lng, t.location_privacy, t.tag_codes,
             t.category_codes, t.search_text,
             d.slug as destination_slug, d.name_translations as destination_names, d.country_code,
             d.latitude as d_lat, d.longitude as d_lng,
             (select jsonb_object_agg(c.locale, c.published_value) from tour.content c
               where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title'
                 and nullif(btrim(c.published_value), '') is not null) as titles,
             (select jsonb_object_agg(c.locale, c.published_value) from tour.content c
               where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'summary'
                 and nullif(btrim(c.published_value), '') is not null) as summaries,
             (select m.url from tour.media m where m.tour_id = t.id and coalesce(m.kind, 'image') <> 'video'
               order by m.is_cover desc, m.sort_order limit 1) as image
        from tour.tours t
        left join tour.destinations d on d.id = t.destination_id
       where t.status = 'published' and t.id = any(${ids}::uuid[])`;
    return rows.map((row) => {
      const title = cleanTranslations(row.titles);
      if (!Object.keys(title).length) return null; // untitled draft that slipped through
      const summaries = cleanTranslations(row.summaries);
      const destination = cleanTranslations(row.destination_names);
      // Meeting points can be private: fall back to the destination's coordinates.
      const exact = row.location_privacy === "exact" || row.location_privacy === "public";
      const geo = exact ? coords(row.meeting_lat, row.meeting_lng) : coords(row.d_lat, row.d_lng);
      const geoFallback = geo.lat === null ? coords(row.d_lat, row.d_lng) : geo;
      return {
        sourceId: row.id,
        title,
        subtitle: destination,
        url: `/tours/${row.slug}`,
        image: row.image || null,
        city: lower(row.destination_slug),
        country: lower(row.country_code),
        ...geoFallback,
        priceToman: toToman(row.from_price, row.currency_code),
        rating: num(row.rating_avg),
        reviewCount: row.review_count ?? 0,
        quality: quality({ rating: row.rating_avg, reviews: row.review_count, featured: row.is_featured, sponsored: row.is_sponsored }),
        serviceKey: null,
        providerId: null,
        attrs: { tags: row.tag_codes ?? [], categories: row.category_codes ?? [], currency: row.currency_code, fromPrice: num(row.from_price) },
        text: searchText([allValues(title), allValues(summaries), allValues(destination), row.tag_codes ?? [], row.category_codes ?? [], row.search_text ?? ""]),
        embedExtra: [Object.values(summaries)[0]?.slice(0, 300)],
      };
    }).filter(Boolean);
  },
};

const stay = {
  type: "stay",
  async listIds(sql) {
    const rows = await sql`
      select p.id::text as id from stay.properties p
        join stay.cities c on c.id = p.city_id and c.is_published
       where p.status = 'published'`;
    return rows.map((row) => row.id);
  },
  async fetch(sql, ids) {
    const rows = await sql`
      select p.id::text as id, p.slug, p.kind, p.star_rating, p.name, p.summary, p.description, p.address,
             p.latitude, p.longitude, p.location_privacy, p.rating_avg, p.review_count, p.is_featured,
             p.from_price, p.currency_code, p.amenity_codes, p.search_text,
             c.slug as city_slug, c.name as city_name, c.latitude as c_lat, c.longitude as c_lng,
             (select m.url from stay.media m where m.property_id = p.id order by m.is_cover desc, m.sort_order, m.id limit 1) as image
        from stay.properties p
        join stay.cities c on c.id = p.city_id and c.is_published
       where p.status = 'published' and p.id = any(${ids}::uuid[])`;
    return rows.map((row) => {
      const title = cleanTranslations(row.name);
      if (!Object.keys(title).length) return null;
      const summary = cleanTranslations(row.summary);
      const description = cleanTranslations(row.description);
      const address = cleanTranslations(row.address);
      const cityNames = cleanTranslations(row.city_name);
      const own = coords(row.latitude, row.longitude);
      const geo = row.location_privacy === "approximate" || own.lat === null ? coords(row.c_lat, row.c_lng) : own;
      return {
        sourceId: row.id,
        title,
        subtitle: cityNames,
        url: `/stays/${row.slug}`,
        image: row.image || null,
        city: lower(row.city_slug),
        country: null,
        ...geo,
        priceToman: toToman(row.from_price, row.currency_code),
        rating: num(row.rating_avg),
        reviewCount: row.review_count ?? 0,
        quality: quality({ rating: row.rating_avg, reviews: row.review_count, featured: row.is_featured }),
        serviceKey: null,
        providerId: null,
        attrs: { kind: row.kind, stars: row.star_rating, currency: row.currency_code, fromPrice: num(row.from_price), amenities: row.amenity_codes ?? [] },
        text: searchText([
          allValues(title), allValues(summary), allValues(description), allValues(address), allValues(cityNames),
          row.kind, row.amenity_codes ?? [], row.search_text ?? "",
        ]),
        embedExtra: [Object.values(summary)[0]?.slice(0, 300)],
      };
    }).filter(Boolean);
  },
};

const article = {
  type: "article",
  async listIds(sql) {
    const rows = await sql`
      select distinct p.id::text as id from content.posts p
        join content.post_translations t on t.post_id = p.id and t.status = 'published'`;
    return rows.map((row) => row.id);
  },
  async fetch(sql, ids) {
    const rows = await sql`
      select p.id::text as id, p.slug, p.featured_media, p.is_featured,
             jsonb_object_agg(t.locale_key, t.title) filter (where t.title <> '') as titles,
             jsonb_object_agg(t.locale_key, t.excerpt) filter (where coalesce(t.excerpt, '') <> '') as excerpts,
             string_agg(coalesce(t.search_text, ''), ' ') as texts
        from content.posts p
        join content.post_translations t on t.post_id = p.id and t.status = 'published'
       where p.id = any(${ids}::uuid[])
       group by p.id`;
    return rows.map((row) => {
      const title = cleanTranslations(row.titles);
      if (!Object.keys(title).length) return null;
      const excerpts = cleanTranslations(row.excerpts);
      return {
        sourceId: row.id,
        title,
        subtitle: excerpts,
        url: `/blog/${row.slug}`,
        image: row.featured_media || null,
        city: null,
        country: null,
        lat: null,
        lng: null,
        priceToman: null,
        rating: null,
        reviewCount: 0,
        quality: quality({ featured: row.is_featured }),
        serviceKey: null,
        providerId: null,
        attrs: {},
        text: searchText([allValues(title), allValues(excerpts), plainText(row.texts).slice(0, 20000)]),
        embedExtra: [Object.values(excerpts)[0]?.slice(0, 300)],
      };
    }).filter(Boolean);
  },
};

export const adapters = { provider, offer, tour, stay, article };
