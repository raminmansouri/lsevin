-- AI assistant: admin-set message limits (separate for guests and signed-in users), a daily
-- usage counter, and saving guests' chats (identified by a cookie id) so admins can review them.
-- Safe to run more than once.

begin;

-- One row of settings, edited from the admin "Assistant" page.
create table if not exists ai.settings (
    id smallint primary key default 1 check (id = 1),
    guest_daily_messages int not null default 10,
    user_daily_messages int not null default 50,
    guest_messages_per_chat int not null default 10,
    user_messages_per_chat int not null default 40,
    guest_max_chars int not null default 500,
    user_max_chars int not null default 1500,
    save_guest_chats boolean not null default true,
    updated_at timestamptz not null default now()
);
insert into ai.settings (id) values (1) on conflict (id) do nothing;

-- Messages sent per day per subject: 'user:<id>', 'guest:<cookie id>' or 'ip:<hash>'.
create table if not exists ai.usage_daily (
    day date not null,
    subject text not null,
    messages int not null default 0,
    primary key (day, subject)
);

-- Guests' chats are saved too: a chat belongs to a user or to a guest cookie id.
alter table ai.conversations alter column user_id drop not null;
alter table ai.conversations add column if not exists guest_id uuid null;
create index if not exists ix_ai_conversations_guest
    on ai.conversations (guest_id, updated_at desc) where guest_id is not null;
create index if not exists ix_ai_conversations_updated
    on ai.conversations (updated_at desc);

commit;
