alter table shop.attributes add column if not exists is_filterable boolean not null default false;

update shop.attributes set is_filterable = true where display_type in ('select', 'swatch', 'boolean');

create index if not exists ix_product_attributes_value_ids on shop.product_attributes using gin (value_ids);
create index if not exists ix_variant_attribute_values_value on shop.variant_attribute_values (attribute_value_id);