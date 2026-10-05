-- Support inbox filtering and polling use these paths on every refresh.
create index if not exists ix_support_conversations_inbox_order
  on support.conversations (last_message_at desc nulls last, create_date desc);

create index if not exists ix_support_conversations_status_priority
  on support.conversations (status, priority, last_message_at desc nulls last);

create index if not exists ix_support_conversations_assignee
  on support.conversations (assigned_to_user_id, last_message_at desc nulls last)
  where assigned_to_user_id is not null;

create index if not exists ix_support_messages_conversation_created
  on support.messages (conversation_id, create_date)
  where deleted_at is null;

create index if not exists ix_support_conversation_tags_lookup
  on support.conversation_tags (tag_id, conversation_id);
