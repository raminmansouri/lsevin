-- Store the actual value(s) of each attribute attached to a product.
-- select-type attributes (Certification, Material, …): one or more attribute_values ids, e.g. CE + FDA listed.
-- text-type attributes (FDA Approval, …): free text.
alter table shop.product_attributes
  add column if not exists value_ids uuid[] not null default '{}',
  add column if not exists text_value text;