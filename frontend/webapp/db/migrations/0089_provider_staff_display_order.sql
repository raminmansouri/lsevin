-- Admin-set order of a provider's specialists on its page (per provider: the same specialist
-- can rank differently at two places). 0 = no position set; those follow the ordered ones,
-- by rating then name, exactly as before. Safe to run more than once.
alter table category.provider_staffs
  add column if not exists display_order integer not null default 0;
