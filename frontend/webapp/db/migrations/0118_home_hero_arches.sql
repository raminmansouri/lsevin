begin;

create table if not exists marketing.home_hero_arches (
  slot smallint primary key check (slot between 1 and 3),
  image_url text,
  label_translations jsonb not null default '{}'::jsonb,
  link_url text,
  updated_at timestamptz not null default now()
);

comment on table marketing.home_hero_arches is
  'The three arch pictures of the desktop home hero. Slot 1 is the large middle arch (9:16, 900x1600), slots 2 and 3 the side arches (5:9, 750x1350).';

insert into marketing.home_hero_arches (slot) values (1), (2), (3)
on conflict (slot) do nothing;

commit;
