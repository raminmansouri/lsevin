-- Keep the indexed catalogue search document multilingual. The original
-- trigger only indexed en-US, which forced non-English searches to expand
-- every translation JSON object for every row at request time.

create or replace function category.translation_search_text(translations jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(string_agg(value, ' ' order by key), '')
  from jsonb_each_text(
    case when jsonb_typeof(translations) = 'object' then translations else '{}'::jsonb end
  );
$$;

create or replace function category.provider_services_search_sync()
returns trigger
language plpgsql
as $$
begin
  new.search_text := lower(concat_ws(' ',
    category.translation_search_text(new.display_name_translations),
    category.translation_search_text(new.description_translations)
  ));
  new.search_vector := to_tsvector('simple', coalesce(new.search_text, ''));
  return new;
end;
$$;

create or replace function category.service_providers_search_sync()
returns trigger
language plpgsql
as $$
begin
  new.search_text := lower(concat_ws(' ',
    category.translation_search_text(new.name_translations),
    category.translation_search_text(new.description_translations)
  ));
  new.search_vector := to_tsvector('simple', coalesce(new.search_text, ''));
  return new;
end;
$$;

update category.provider_services
set search_text = lower(concat_ws(' ',
      category.translation_search_text(display_name_translations),
      category.translation_search_text(description_translations)
    )),
    search_vector = to_tsvector('simple', lower(concat_ws(' ',
      category.translation_search_text(display_name_translations),
      category.translation_search_text(description_translations)
    )));

update category.service_providers
set search_text = lower(concat_ws(' ',
      category.translation_search_text(name_translations),
      category.translation_search_text(description_translations)
    )),
    search_vector = to_tsvector('simple', lower(concat_ws(' ',
      category.translation_search_text(name_translations),
      category.translation_search_text(description_translations)
    )));

analyze category.provider_services;
analyze category.service_providers;
