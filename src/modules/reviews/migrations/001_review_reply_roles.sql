alter table category.service_provider_comment_replies
  drop constraint if exists ck_service_provider_comment_replies_author_role;

alter table category.service_provider_comment_replies
  add constraint ck_service_provider_comment_replies_author_role
  check (author_role in ('admin', 'customer', 'provider', 'staff'));
