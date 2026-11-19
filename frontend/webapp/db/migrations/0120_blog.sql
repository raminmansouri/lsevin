-- Blog: posts built from ordered blocks, one independent document per language.
-- Design: docs/blog-cms/BLOG-SUBSYSTEM-DESIGN.md. Additive only; content.site_pages and
-- content.faq_items are untouched.
--
-- Translations are keyed by locale header ("fa-IR", "en-US", ...) like the rest of the catalog.
-- A post is public in a language when that language's row is 'published' and published_at <= now(),
-- so scheduling needs no job runner. Avoid DEFERRABLE constraints on these tables: SymmetricDS
-- initial loads cannot use them in ON CONFLICT (see tour.itinerary_stops).

begin;

create schema if not exists content;

create table if not exists content.post_categories (
  id uuid primary key default public.uuid_generate_v4(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name_translations jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content.post_authors (
  id uuid primary key default public.uuid_generate_v4(),
  -- Optional link to an identity user (soft reference; identity lives in another schema).
  user_id uuid,
  name_translations jsonb not null default '{}'::jsonb,
  bio_translations jsonb not null default '{}'::jsonb,
  credentials_translations jsonb not null default '{}'::jsonb,
  avatar_media text,
  is_medical_reviewer boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content.posts (
  id uuid primary key default public.uuid_generate_v4(),
  -- One ASCII slug shared by every language: /{locale}/blog/{slug}. Changes are recorded in
  -- content.post_slug_history and old URLs redirect (308).
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  category_id uuid references content.post_categories (id) on delete set null,
  author_id uuid references content.post_authors (id) on delete set null,
  reviewer_id uuid references content.post_authors (id) on delete set null,
  last_reviewed_at timestamptz,
  -- media.media_library id or file URL (the media picker stores either).
  featured_media text,
  is_featured boolean not null default false,
  is_medical boolean not null default false,
  -- Where an imported post came from (e.g. the WordPress URL); makes imports idempotent.
  source_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index if not exists ix_content_posts_category on content.posts (category_id);

create table if not exists content.post_translations (
  post_id uuid not null references content.posts (id) on delete cascade,
  locale_key text not null check (locale_key ~ '^[a-z]{2,3}-[A-Z]{2}$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title text not null default '',
  excerpt text not null default '',
  -- Ordered blocks (see src/features/blog/blocks/schema.ts); schema_version lets readers migrate.
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  schema_version integer not null default 1,
  seo_title text not null default '',
  seo_description text not null default '',
  og_media text,
  published_at timestamptz,
  reading_minutes integer not null default 1,
  -- Plain text of the body, kept for search (index added when search ships).
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (post_id, locale_key),
  constraint ck_content_post_translations_published check (status <> 'published' or published_at is not null)
);

create index if not exists ix_content_post_translations_public
  on content.post_translations (locale_key, published_at desc)
  where status = 'published';

-- Insert-only history. kind 'autosave' is a single row per (post, language) updated in place, so a
-- long editing session does not grow the table; 'save' and 'publish' rows are kept (30 saves).
create table if not exists content.post_revisions (
  id uuid primary key default public.uuid_generate_v4(),
  post_id uuid not null references content.posts (id) on delete cascade,
  locale_key text not null,
  kind text not null check (kind in ('autosave', 'save', 'publish')),
  title text not null default '',
  excerpt text not null default '',
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists ix_content_post_revisions_lookup
  on content.post_revisions (post_id, locale_key, created_at desc);
create unique index if not exists ux_content_post_revisions_autosave
  on content.post_revisions (post_id, locale_key)
  where kind = 'autosave';

create table if not exists content.post_slug_history (
  old_slug text primary key check (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  post_id uuid not null references content.posts (id) on delete cascade,
  changed_at timestamptz not null default now()
);

create index if not exists ix_content_post_slug_history_post on content.post_slug_history (post_id);

commit;
