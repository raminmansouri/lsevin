-- Chat history for the AI assistant ("LSevin Assistant", /api/assistant).
--
-- Only signed-in users are saved. One row in ai.conversations per chat, one row in ai.messages
-- per user or assistant message. A message keeps the AI SDK UIMessage `parts` array as-is in
-- jsonb (text plus tool results such as search_services cards), so a chat loads back exactly as
-- it was shown.
--
-- conversations.id is the chat id the browser generates (a uuid, validated by the app).
-- conversations.user_id is identity.asp_net_users.id, a soft reference (no FK), matching the
-- cross-schema convention of the other hand-written schemas (see 0048_patient_foundation).
--
-- messages.client_message_id is the UIMessage id; the unique key makes saving idempotent when
-- the browser resends a message it already sent.
--
-- Numbered 0073 because Lsevin-New already has 0072_shop_product_attribute_values.

begin;

create schema if not exists ai;

create table if not exists ai.conversations (
    id uuid primary key,
    user_id uuid not null,
    locale text null,
    title text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_ai_conversations_user_updated
    on ai.conversations (user_id, updated_at desc);

create table if not exists ai.messages (
    id uuid primary key default public.uuid_generate_v4(),
    conversation_id uuid not null
        references ai.conversations (id) on delete cascade,
    client_message_id text not null,
    role text not null,
    parts jsonb not null,
    text_content text null,
    created_at timestamptz not null default now(),
    constraint ck_ai_messages_role
        check (role in ('user', 'assistant', 'system')),
    constraint uq_ai_messages_conversation_client_message
        unique (conversation_id, client_message_id)
);

create index if not exists ix_ai_messages_conversation_created
    on ai.messages (conversation_id, created_at);

comment on table ai.conversations is
  'AI assistant chats of signed-in users. id is the browser chat id; user_id is identity.asp_net_users.id (soft reference).';
comment on table ai.messages is
  'Messages of an AI assistant chat. parts is the AI SDK UIMessage parts array; text_content is the plain text for search and admin review.';

commit;
