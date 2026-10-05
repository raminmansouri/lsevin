-- The SQL implementation was inlined at every call site as seven UNION ALL
-- branches with repeated jsonb_each_text scans. Catalogue and admin queries
-- call this function many times, producing very large plans and multi-second
-- execution even for short lists. A small immutable PL/pgSQL lookup preserves
-- the same locale/fallback order without expanding the caller's query plan.

create or replace function common.get_translation_t(
  translations jsonb,
  preferred_language text,
  fallback_language text default 'en-US'
)
returns text
language plpgsql
immutable
parallel safe
as $$
declare
  safe_translations jsonb;
  preferred_key text := nullif(btrim(preferred_language), '');
  fallback_key text := nullif(btrim(fallback_language), '');
  preferred_norm text := lower(replace(preferred_key, '_', '-'));
  fallback_norm text := lower(replace(fallback_key, '_', '-'));
  preferred_base text := split_part(preferred_norm, '-', 1);
  fallback_base text := split_part(fallback_norm, '-', 1);
  entry record;
  result text;
begin
  if translations is null then
    safe_translations := '{}'::jsonb;
  elsif jsonb_typeof(translations) = 'object' then
    safe_translations := translations;
  elsif jsonb_typeof(translations) = 'string' then
    return coalesce(nullif(btrim(translations #>> '{}'), ''), '');
  else
    safe_translations := '{}'::jsonb;
  end if;

  result := nullif(btrim(safe_translations ->> preferred_key), '');
  if result is not null then return result; end if;

  if preferred_norm is not null then
    for entry in select key, value from jsonb_each_text(safe_translations) loop
      if lower(replace(entry.key, '_', '-')) = preferred_norm then
        result := nullif(btrim(entry.value), '');
        if result is not null then return result; end if;
      end if;
    end loop;
  end if;

  if preferred_base is not null then
    for entry in select key, value from jsonb_each_text(safe_translations) order by key loop
      if split_part(lower(replace(entry.key, '_', '-')), '-', 1) = preferred_base then
        result := nullif(btrim(entry.value), '');
        if result is not null then return result; end if;
      end if;
    end loop;
  end if;

  result := nullif(btrim(safe_translations ->> fallback_key), '');
  if result is not null then return result; end if;

  if fallback_norm is not null then
    for entry in select key, value from jsonb_each_text(safe_translations) loop
      if lower(replace(entry.key, '_', '-')) = fallback_norm then
        result := nullif(btrim(entry.value), '');
        if result is not null then return result; end if;
      end if;
    end loop;
  end if;

  if fallback_base is not null then
    for entry in select key, value from jsonb_each_text(safe_translations) order by key loop
      if split_part(lower(replace(entry.key, '_', '-')), '-', 1) = fallback_base then
        result := nullif(btrim(entry.value), '');
        if result is not null then return result; end if;
      end if;
    end loop;
  end if;

  select nullif(btrim(value), '')
    into result
    from jsonb_each_text(safe_translations)
   where nullif(btrim(value), '') is not null
   order by key
   limit 1;

  return coalesce(result, '');
end;
$$;
