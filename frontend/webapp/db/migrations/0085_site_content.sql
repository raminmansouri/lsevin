-- Editorial content managed from /admin/editorial: the essential site pages
-- (About, Contact, Terms, policies, ...) and FAQ blocks attached to page types.
-- Translations are keyed by locale header ("fa-IR", "en-US", ...) like the rest
-- of the catalog; rich text holds one serialized Lexical editor state per locale.

create schema if not exists content;

create table if not exists content.site_pages (
  id uuid primary key default public.uuid_generate_v4(),
  -- URL segment under /{locale}/, e.g. "about-us". Immutable once published.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_translations jsonb not null default '{}'::jsonb,
  -- Plain text used for <meta name="description"> and social cards.
  summary_translations jsonb not null default '{}'::jsonb,
  body_translations jsonb not null default '{}'::jsonb,
  -- media.media_library id or file URL (the media picker stores either).
  hero_media text,
  is_published boolean not null default false,
  show_in_footer boolean not null default true,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  updated_by uuid
);

-- An FAQ item belongs to a page type (scope) and, optionally, to one entity of
-- that type. entity_id is a soft reference (catalog ids live in other schemas);
-- entity_key names things without a uuid: a site page slug or a sub-app such as
-- "tours". An item with neither applies to every page of its scope.
create table if not exists content.faq_items (
  id uuid primary key default public.uuid_generate_v4(),
  scope text not null check (scope in (
    'home', 'explore', 'search', 'map', 'categories',
    'provider', 'specialist', 'service', 'category', 'provider_type',
    'app', 'site_page'
  )),
  entity_id uuid,
  entity_key text check (entity_key is null or entity_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  question_translations jsonb not null default '{}'::jsonb,
  answer_translations jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  -- Set only on items inserted by a seed migration, so re-running a seed never
  -- duplicates them; admin-created items leave it null.
  seed_key text unique,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  updated_by uuid,
  constraint ck_content_faq_items_target check (
    (scope in ('app', 'site_page') and entity_key is not null and entity_id is null)
    or (scope not in ('app', 'site_page') and entity_key is null)
  )
);

create index if not exists ix_content_faq_items_lookup
  on content.faq_items (scope, entity_id, entity_key, display_order)
  where is_active;
