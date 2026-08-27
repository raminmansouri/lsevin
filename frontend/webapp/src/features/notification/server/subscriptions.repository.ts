import "server-only";

import sql from "@/config/database/db";

let subscriptionTablesEnsured = false;

export async function ensureSubscriptionTables(): Promise<void> {
  if (subscriptionTablesEnsured) return;

  await sql`
    create table if not exists notify.push_subscriptions (
      id uuid default public.uuid_generate_v4() not null primary key,
      user_id uuid not null references identity.asp_net_users(id) on delete cascade,
      endpoint text not null unique,
      p256dh text not null,
      auth text not null,
      created_at timestamp with time zone default now() not null
    )
  `;
  await sql`create index if not exists ix_push_subscriptions_user_id on notify.push_subscriptions (user_id)`;

  await sql`
    create table if not exists notify.bale_links (
      user_id uuid not null primary key references identity.asp_net_users(id) on delete cascade,
      chat_id text not null,
      linked_at timestamp with time zone default now() not null
    )
  `;

  await sql`
    create table if not exists notify.bale_link_codes (
      code text not null primary key,
      user_id uuid not null references identity.asp_net_users(id) on delete cascade,
      expires_at timestamp with time zone not null,
      created_at timestamp with time zone default now() not null
    )
  `;

  subscriptionTablesEnsured = true;
}

export async function savePushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  await ensureSubscriptionTables();
  await sql`
    insert into notify.push_subscriptions (user_id, endpoint, p256dh, auth)
    values (${input.userId}::uuid, ${input.endpoint}, ${input.p256dh}, ${input.auth})
    on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth
  `;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await ensureSubscriptionTables();
  await sql`delete from notify.push_subscriptions where endpoint = ${endpoint}`;
}

function generateLinkCode(): string {
  // Short, URL-safe, human-typeable if the deep link fails to auto-fill /start.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function createBaleLinkCode(userId: string): Promise<string> {
  await ensureSubscriptionTables();
  const code = generateLinkCode();

  await sql`
    insert into notify.bale_link_codes (code, user_id, expires_at)
    values (${code}, ${userId}::uuid, now() + interval '15 minutes')
  `;

  return code;
}

export async function resolveBaleLinkCode(input: { code: string; chatId: string }): Promise<{ userId: string } | null> {
  await ensureSubscriptionTables();

  const rows = await sql<{ userId: string }[]>`
    delete from notify.bale_link_codes
    where code = ${input.code} and expires_at > now()
    returning user_id::text as "userId"
  `;

  const userId = rows[0]?.userId;
  if (!userId) return null;

  await sql`
    insert into notify.bale_links (user_id, chat_id)
    values (${userId}::uuid, ${input.chatId})
    on conflict (user_id) do update set chat_id = excluded.chat_id, linked_at = now()
  `;

  return { userId };
}

export async function getBaleLink(userId: string): Promise<{ chatId: string; linkedAt: string } | null> {
  await ensureSubscriptionTables();
  const rows = await sql<{ chatId: string; linkedAt: string }[]>`
    select chat_id as "chatId", linked_at::text as "linkedAt"
    from notify.bale_links
    where user_id = ${userId}::uuid
    limit 1
  `;
  return rows[0] || null;
}
