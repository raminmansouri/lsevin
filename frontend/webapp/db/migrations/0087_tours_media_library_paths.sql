-- ---------------------------------------------------------------------------
-- 0087 — Tours: store media-library paths, not one site's resolved URL.
--
-- The admin media picker stored "https://<files host>/files/<path>" (the path resolved
-- against the site the admin was on). Two problems:
--   * the picker looks items up by the library's own value ("<path>"), so a saved
--     image showed as "No file selected" when the record was reopened;
--   * the host of the site where it was picked (e.g. Iran) was baked into data that
--     replicates to the other site, so the other site's visitors loaded images from it.
-- From now on the library path is stored as is and resolved per site when displayed.
--
-- 1. tour.media.url may hold a library path (the other image columns have no check).
-- 2. Existing values on a "/files/" host whose path exists in the media library are
--    rewritten to that path. Anything else (shipped /images/…, provider https URLs)
--    is left untouched. Idempotent: a second run finds nothing to rewrite.
-- ---------------------------------------------------------------------------

alter table tour.media drop constraint if exists media_url_check;
alter table tour.media add constraint media_url_check check (
  url !~ '\.\.' and (
    url ~* '^https?://[^[:space:]]+$'
    or url ~ '^/[^/[:space:]][^[:space:]]*$'
    or url ~ '^[A-Za-z0-9][A-Za-z0-9._ /-]*$'
  )
);

create or replace function pg_temp.library_path(p text) returns text
language sql stable as $$
  select m.file_url
    from media.media_library m
   where p ~* '^https?://[^/]+/files/'
     and m.file_url = regexp_replace(p, '^https?://[^/]+/files/', '', 'i')
   limit 1
$$;

update tour.destinations set cover_url = pg_temp.library_path(cover_url), updated_at = now()
 where pg_temp.library_path(cover_url) is not null;

update tour.editorial_modules set image_url = pg_temp.library_path(image_url)
 where pg_temp.library_path(image_url) is not null;

update tour.itinerary_stops set image_url = pg_temp.library_path(image_url)
 where pg_temp.library_path(image_url) is not null;

update tour.media set url = pg_temp.library_path(url)
 where pg_temp.library_path(url) is not null;

update tour.media set thumbnail_url = pg_temp.library_path(thumbnail_url)
 where pg_temp.library_path(thumbnail_url) is not null;
