alter table stay.amenities add column image_id uuid references media.media_library(id) on delete set null;
create index ix_stay_amenities_image on stay.amenities(image_id) where image_id is not null;
