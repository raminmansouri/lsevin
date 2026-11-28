-- Unified search ("a small Google" inside the app).
--
-- One index of everything a visitor can look for (clinics, treatments offered by a
-- clinic, tours, stays, articles), ranked from three signals at once: keywords
-- (trigram + full text), meaning (pgvector embeddings from the self-hosted
-- multilingual-e5-small model, 384 dimensions) and place (latitude/longitude).
--
-- Design notes
--  * New data type = one adapter in scripts/search/adapters.mjs. No schema change: the
--    documents table is list-partitioned by doc_type with a DEFAULT partition.
--  * These tables are DERIVED data. Each site (A and B) builds its own index, so they are
--    deliberately not registered with SymmetricDS. Row triggers below only queue work;
--    they never fail the write that fired them.
--  * Embeddings are stored as halfvec (half the memory of vector) and every row records
--    the model that produced it, so the model can change without a flag day.
--  * Existing migrations are untouched. ai.knowledge_chunks (assistant) gains a second,
--    nullable embedding column for the local model; the OpenAI column becomes nullable.

create extension if not exists vector;
create extension if not exists pg_trgm;
create schema if not exists search;

-- ---------------------------------------------------------------- documents
create table if not exists search.documents (
  doc_type        text        not null,
  source_id       text        not null,
  -- Display fields keep every language: { "fa-IR": "...", "en-US": "..." }.
  title           jsonb       not null default '{}'::jsonb,
  subtitle        jsonb       not null default '{}'::jsonb,
  -- Locale-free path ("/providers/dr-ali"); the app prefixes the locale.
  url             text        not null,
  image           text,
  city            text,                       -- lower-case slug, e.g. "tehran"
  country         text,                       -- lower-case ISO code, e.g. "ir"
  lat             double precision,
  lng             double precision,
  price_toman     numeric,
  rating          numeric,
  review_count    integer     not null default 0,
  -- 0..1 blend of rating, reviews, featured/sponsored flags: the tie-breaker in ranking.
  quality         real        not null default 0,
  -- The treatment/service this row is about (service_definitions.id) and its provider,
  -- for filters and for landing-page grouping.
  service_key     text,
  provider_id     text,
  attrs           jsonb       not null default '{}'::jsonb,
  -- Folded (Persian/Arabic yeh+kaf unified, ZWNJ -> space, lower case) text of every
  -- language, built by the indexer.
  search_text     text        not null,
  tsv             tsvector generated always as (to_tsvector('simple', search_text)) stored,
  is_public       boolean     not null default true,
  content_hash    text        not null,
  embedding       halfvec(384),
  embedding_model text,
  indexed_at      timestamptz not null default now(),
  primary key (doc_type, source_id)
) partition by list (doc_type);

create table if not exists search.documents_provider partition of search.documents for values in ('provider');
create table if not exists search.documents_offer    partition of search.documents for values in ('offer');
create table if not exists search.documents_tour     partition of search.documents for values in ('tour');
create table if not exists search.documents_stay     partition of search.documents for values in ('stay');
create table if not exists search.documents_article  partition of search.documents for values in ('article');
create table if not exists search.documents_other    partition of search.documents default;

-- Keywords: typo-tolerant trigram match and exact-word full text.
create index if not exists ix_search_documents_trgm
  on search.documents using gin (search_text gin_trgm_ops);
create index if not exists ix_search_documents_tsv
  on search.documents using gin (tsv);
-- Meaning: nearest-neighbour search by cosine distance (one small index per partition).
create index if not exists ix_search_documents_embedding
  on search.documents using hnsw (embedding halfvec_cosine_ops) where embedding is not null;
-- Place: point index for "closest to here" and bounding-box filters.
create index if not exists ix_search_documents_geo
  on search.documents using gist (point(lng, lat)) where lat is not null and lng is not null;
-- Filters and landing-page grouping.
create index if not exists ix_search_documents_city
  on search.documents (city) where is_public;
create index if not exists ix_search_documents_service
  on search.documents (service_key, city) where is_public and service_key is not null;

-- ------------------------------------------------------------ embedding cache
-- Unchanged text is never embedded twice; also caches query embeddings.
create table if not exists search.embedding_cache (
  model        text        not null,
  content_hash text        not null,
  embedding    halfvec(384) not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  primary key (model, content_hash)
);

-- --------------------------------------------------------------------- outbox
-- "This item changed". The indexer claims rows older than its batch start and deletes
-- exactly those, so a change that lands mid-batch is processed on the next run.
create table if not exists search.outbox (
  source_type text        not null,
  source_id   text        not null,
  enqueued_at timestamptz not null default clock_timestamp(),
  primary key (source_type, source_id)
);

-- ------------------------------------------------------------ source registry
create table if not exists search.sources (
  doc_type       text primary key,
  description    text    not null,
  enabled        boolean not null default true,
  last_full_sync timestamptz
);

insert into search.sources (doc_type, description) values
  ('provider', 'Clinics, hospitals and other service providers'),
  ('offer',    'A treatment/service offered by a provider (provider_services)'),
  ('tour',     'Published tours'),
  ('stay',     'Published stays (hotels, apartments, villas)'),
  ('article',  'Published blog articles')
on conflict (doc_type) do nothing;

-- ------------------------------------------------------------------- synonyms
-- "هیر ترانسپلنت", "FUE", "hair transplant" all mean "کاشت مو". Editable by operators;
-- the query is expanded with the canonical term before keyword and vector search.
create table if not exists search.synonyms (
  term       text primary key,        -- folded form
  canonical  text not null,           -- folded form
  created_at timestamptz not null default now()
);

insert into search.synonyms (term, canonical) values
  ('هیر ترانسپلنت', 'کاشت مو'),
  ('هیرترانسپلنت',  'کاشت مو'),
  ('هیر ترنسپلنت',  'کاشت مو'),
  ('کاشت موی سر',   'کاشت مو'),
  ('پیوند مو',      'کاشت مو'),
  ('hair transplant', 'کاشت مو'),
  ('hair transplantation', 'کاشت مو'),
  ('hair implant',  'کاشت مو'),
  ('fue',           'کاشت مو'),
  ('fut',           'کاشت مو'),
  ('rhinoplasty',   'جراحی بینی'),
  ('nose job',      'جراحی بینی'),
  ('عمل بینی',      'جراحی بینی'),
  ('بینی',          'جراحی بینی'),
  ('dental implant','ایمپلنت دندان'),
  ('ایمپلنت',       'ایمپلنت دندان'),
  ('laser hair removal', 'لیزر موهای زائد'),
  ('لیزر موهای زاید', 'لیزر موهای زائد'),
  ('تزریق ژل',      'فیلر')
on conflict (term) do nothing;

-- --------------------------------------------------------------------- places
-- Gazetteer for "قیطریه", "Zafaranieh"... Providers rarely mention the neighbourhood, so a
-- place is turned into a point and results are ranked by distance to it.
create table if not exists search.places (
  id        serial primary key,
  kind      text not null check (kind in ('city', 'neighborhood')),
  name      text not null,                 -- folded Persian name
  aliases   text[] not null default '{}',  -- folded alternative spellings (any language)
  city_slug text not null,
  lat       double precision not null,
  lng       double precision not null,
  radius_m  integer not null default 2500,
  source    text not null default 'curated-approx',
  unique (kind, city_slug, name)
);
create index if not exists ix_search_places_aliases on search.places using gin (aliases);

insert into search.places (kind, name, aliases, city_slug, lat, lng, radius_m) values
  ('city', 'تهران',    '{tehran}',                         'tehran',     35.6892, 51.3890, 25000),
  ('city', 'مشهد',     '{mashhad}',                        'mashhad',    36.2605, 59.6168, 15000),
  ('city', 'شیراز',    '{shiraz}',                         'shiraz',     29.5918, 52.5837, 12000),
  ('city', 'اصفهان',   '{isfahan,esfahan}',                'isfahan',    32.6546, 51.6680, 12000),
  ('city', 'تبریز',    '{tabriz}',                         'tabriz',     38.0800, 46.2919, 12000),
  ('city', 'کرج',      '{karaj}',                          'karaj',      35.8327, 50.9915, 10000),
  ('city', 'یزد',      '{yazd}',                           'yazd',       31.8974, 54.3569, 8000),
  ('city', 'کیش',      '{kish}',                           'kish',       26.5579, 53.9800, 12000),
  ('city', 'رشت',      '{rasht}',                          'rasht',      37.2808, 49.5832, 8000),
  ('city', 'اهواز',    '{ahvaz}',                          'ahvaz',      31.3183, 48.6706, 10000),
  ('city', 'کاشان',    '{kashan}',                         'kashan',     33.9850, 51.4100, 6000),
  ('city', 'قم',       '{qom,ghom}',                       'qom',        34.6416, 50.8746, 8000),
  ('city', 'استانبول', '{istanbul,استنبول}',      'istanbul',   41.0082, 28.9784, 25000),
  ('city', 'دبی',      '{dubai}',                          'dubai',      25.2048, 55.2708, 25000),
  ('city', 'ابوظبی',   '{abudhabi,abu dhabi}',             'abudhabi',   24.4539, 54.3773, 20000),
  ('city', 'مسقط',     '{muscat}',                         'muscat',     23.5880, 58.3829, 15000)
on conflict do nothing;

-- Well-known Tehran neighbourhoods. Centres are APPROXIMATE (checked only to ~1 km):
-- replace with OpenStreetMap data via scripts/search-import-places.mjs when available.
insert into search.places (kind, name, aliases, city_slug, lat, lng, radius_m) values
  ('neighborhood', 'قیطریه',   '{gheytarieh,qeytarieh,gheitarieh}',        'tehran', 35.7950, 51.4430, 1800),
  ('neighborhood', 'الهیه',    '{elahieh,elahiyeh}',                       'tehran', 35.7930, 51.4220, 1500),
  ('neighborhood', 'زعفرانیه', '{zafaranieh,zaferanieh}',                  'tehran', 35.8060, 51.4130, 1800),
  ('neighborhood', 'نیاوران',  '{niavaran}',                               'tehran', 35.8120, 51.4700, 2000),
  ('neighborhood', 'فرمانیه',  '{farmanieh}',                              'tehran', 35.7970, 51.4590, 1500),
  ('neighborhood', 'دروس',     '{darous,deroos}',                          'tehran', 35.7870, 51.4520, 1500),
  ('neighborhood', 'اقدسیه',   '{aghdasieh,aqdasieh}',                     'tehran', 35.8010, 51.5000, 2000),
  ('neighborhood', 'تجریش',    '{tajrish}',                                'tehran', 35.8040, 51.4300, 1500),
  ('neighborhood', 'ولنجک',    '{velenjak}',                               'tehran', 35.8110, 51.3980, 1500),
  ('neighborhood', 'جماران',   '{jamaran}',                                'tehran', 35.8180, 51.4290, 1500),
  ('neighborhood', 'شهرک غرب', '{shahrak-e gharb,shahrak gharb,قدس}',       'tehran', 35.7620, 51.3640, 2500),
  ('neighborhood', 'سعادت آباد','{saadat abad,saadatabad,سعادتآباد}',      'tehran', 35.7870, 51.3770, 2000),
  ('neighborhood', 'ونک',      '{vanak}',                                  'tehran', 35.7570, 51.4090, 1500),
  ('neighborhood', 'جردن',     '{jordan,africa,آفریقا}',                   'tehran', 35.7700, 51.4140, 1500),
  ('neighborhood', 'یوسف آباد','{yousef abad,yusefabad,یوسفآباد}',         'tehran', 35.7330, 51.4000, 2000),
  ('neighborhood', 'ستارخان',  '{sattarkhan,sattar khan}',                 'tehran', 35.7160, 51.3550, 2000),
  ('neighborhood', 'صادقیه',   '{sadeghieh,sadeqieh}',                     'tehran', 35.7230, 51.3290, 2000),
  ('neighborhood', 'پاسداران', '{pasdaran}',                               'tehran', 35.7810, 51.4680, 2500),
  ('neighborhood', 'میرداماد', '{mirdamad}',                               'tehran', 35.7620, 51.4360, 1800),
  ('neighborhood', 'پونک',     '{punak,poonak}',                           'tehran', 35.7650, 51.3300, 2000),
  ('neighborhood', 'گیشا',     '{gisha,kuye nasr,کوی نصر}',                'tehran', 35.7390, 51.3680, 1800),
  ('neighborhood', 'اکباتان',  '{ekbatan}',                                'tehran', 35.7040, 51.2920, 2000),
  ('neighborhood', 'نارمک',    '{narmak}',                                 'tehran', 35.7390, 51.5000, 2500),
  ('neighborhood', 'تهرانپارس','{tehranpars,tehran pars}',                 'tehran', 35.7400, 51.5200, 3000),
  ('neighborhood', 'میدان ولیعصر', '{vali asr square,valiasr square,ولیعصر}', 'tehran', 35.7125, 51.4090, 1800),
  ('neighborhood', 'میدان انقلاب', '{enghelab square,engelab,انقلاب}',     'tehran', 35.7015, 51.3910, 1800)
on conflict do nothing;

-- ------------------------------------------------------------------ query log
-- No user identity: only a salted session hash supplied by the app. Used to learn what
-- visitors look for and which searches find nothing.
create table if not exists search.query_log (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  query        text        not null,
  normalized   text        not null,
  locale       text,
  results      integer     not null,
  took_ms      integer     not null,
  used_vector  boolean     not null default false,
  session_hash text
);
create index if not exists ix_search_query_log_created on search.query_log (created_at);
create index if not exists ix_search_query_log_zero on search.query_log (normalized) where results = 0;

create or replace function search.prune_query_log(keep interval default interval '180 days')
returns bigint language sql as $$
  with gone as (delete from search.query_log where created_at < now() - keep returning 1)
  select count(*) from gone;
$$;

create or replace view search.v_zero_result_queries as
  select normalized, count(*) as times, max(created_at) as last_seen
    from search.query_log
   where results = 0 and created_at > now() - interval '30 days'
   group by normalized
   order by times desc, last_seen desc;

create or replace view search.v_top_queries as
  select normalized, count(*) as times, round(avg(results), 1) as avg_results, round(avg(took_ms)) as avg_ms
    from search.query_log
   where created_at > now() - interval '30 days'
   group by normalized
   order by times desc;

-- ------------------------------------------------------------ autocomplete
-- Prefix/trigram suggestions without any embedding call. Filled by the indexer.
create table if not exists search.suggestions (
  term     text primary key,         -- folded
  display  text not null,
  doc_type text not null,
  weight   real not null default 0
);
create index if not exists ix_search_suggestions_prefix on search.suggestions (term text_pattern_ops);
create index if not exists ix_search_suggestions_trgm on search.suggestions using gin (term gin_trgm_ops);

-- ---------------------------------------------------------- landing candidates
-- Combinations (treatment x city) with enough real, public providers to deserve an
-- indexable page. Anything thinner would be a doorway page Google ignores or penalises.
create or replace view search.landing_candidates as
  select d.service_key,
         d.city,
         count(distinct d.provider_id)          as providers,
         min(d.price_toman)                     as min_price_toman,
         round(avg(d.rating) filter (where d.rating > 0), 2) as avg_rating,
         max(d.indexed_at)                      as updated_at
    from search.documents d
   where d.doc_type = 'offer' and d.is_public
     and d.service_key is not null and d.city is not null and d.provider_id is not null
   group by d.service_key, d.city
  having count(distinct d.provider_id) >= 3;

-- ------------------------------------------------------------------- triggers
-- Queue a change. Never raises: indexing must not be able to break a write to the
-- catalogue tables.
create or replace function search.enqueue(p_type text, p_id text) returns void
language plpgsql as $$
begin
  insert into search.outbox (source_type, source_id) values (p_type, p_id)
  on conflict (source_type, source_id) do update set enqueued_at = clock_timestamp();
exception when others then
  null;
end;
$$;

-- tg args: 0 = source type, 1 = name of the id column
create or replace function search.trg_enqueue() returns trigger
language plpgsql as $$
declare
  rec jsonb;
begin
  rec := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  perform search.enqueue(tg_argv[0], rec ->> tg_argv[1]);
  return null;
exception when others then
  return null;
end;
$$;

-- A provider change (name, city, coordinates, rating) changes all of its offers too.
create or replace function search.trg_enqueue_provider() returns trigger
language plpgsql as $$
declare
  pid uuid;
begin
  pid := case when tg_op = 'DELETE' then old.id else new.id end;
  perform search.enqueue('provider', pid::text);
  insert into search.outbox (source_type, source_id)
    select 'offer', ps.id::text from category.provider_services ps where ps.service_provider_id = pid
  on conflict (source_type, source_id) do update set enqueued_at = clock_timestamp();
  return null;
exception when others then
  return null;
end;
$$;

-- A treatment rename changes the text of every offer of that treatment.
create or replace function search.trg_enqueue_definition() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and old.name_translations is not distinct from new.name_translations
     and old.description_translations is not distinct from new.description_translations
     and old.is_active is not distinct from new.is_active then
    return null;
  end if;
  insert into search.outbox (source_type, source_id)
    select 'offer', ps.id::text from category.provider_services ps
     where ps.service_definition_id = (case when tg_op = 'DELETE' then old.id else new.id end)
  on conflict (source_type, source_id) do update set enqueued_at = clock_timestamp();
  return null;
exception when others then
  return null;
end;
$$;

-- Posts keep their text per language in content.post_translations; the document is the post.
create or replace function search.trg_enqueue_post_translation() returns trigger
language plpgsql as $$
begin
  perform search.enqueue('article', (case when tg_op = 'DELETE' then old.post_id else new.post_id end)::text);
  return null;
exception when others then
  return null;
end;
$$;

do $$
begin
  if to_regclass('category.service_providers') is not null then
    drop trigger if exists trg_search_provider on category.service_providers;
    create trigger trg_search_provider after insert or update or delete on category.service_providers
      for each row execute function search.trg_enqueue_provider();
  end if;
  if to_regclass('category.provider_services') is not null then
    drop trigger if exists trg_search_offer on category.provider_services;
    create trigger trg_search_offer after insert or update or delete on category.provider_services
      for each row execute function search.trg_enqueue('offer', 'id');
  end if;
  if to_regclass('category.service_definitions') is not null then
    drop trigger if exists trg_search_definition on category.service_definitions;
    create trigger trg_search_definition after update or delete on category.service_definitions
      for each row execute function search.trg_enqueue_definition();
  end if;
  if to_regclass('tour.tours') is not null then
    drop trigger if exists trg_search_tour on tour.tours;
    create trigger trg_search_tour after insert or update or delete on tour.tours
      for each row execute function search.trg_enqueue('tour', 'id');
  end if;
  if to_regclass('stay.properties') is not null then
    drop trigger if exists trg_search_stay on stay.properties;
    create trigger trg_search_stay after insert or update or delete on stay.properties
      for each row execute function search.trg_enqueue('stay', 'id');
  end if;
  if to_regclass('content.post_translations') is not null then
    drop trigger if exists trg_search_article on content.post_translations;
    create trigger trg_search_article after insert or update or delete on content.post_translations
      for each row execute function search.trg_enqueue_post_translation();
  end if;
end $$;

-- --------------------------------------------- assistant knowledge (local model)
-- The assistant's knowledge base can embed with the same self-hosted model, so only the
-- chat answer itself still needs an external API. The OpenAI column stays for rollback.
do $$
begin
  if to_regclass('ai.knowledge_chunks') is not null then
    alter table ai.knowledge_chunks alter column embedding drop not null;
    alter table ai.knowledge_chunks add column if not exists embedding_local halfvec(384);
    alter table ai.knowledge_chunks add column if not exists embedding_model text;
    create index if not exists ix_knowledge_chunks_embedding_local
      on ai.knowledge_chunks using hnsw (embedding_local halfvec_cosine_ops)
      where embedding_local is not null;
  end if;
end $$;
