import "server-only";

import type { UIMessage } from "ai";

import sql from "@/config/database/db";
import { getAdminSession } from "@/lib/admin/auth";

export const ADMIN_PAGE_SIZE = 50;

export type AdminConversationRow = {
  id: string;
  title: string | null;
  locale: string | null;
  updatedAt: string;
  userId: string | null;
  guestId: string | null;
  userEmail: string | null;
  userMessages: number;
};

/** All saved chats (users and guests), newest first, with search over titles and message text. */
export async function listAssistantConversationsAdmin(filters: { q?: string; who?: string; page?: number }) {
  await getAdminSession();
  const like = filters.q?.trim() ? `%${filters.q.trim()}%` : null;
  const who = filters.who === "users" || filters.who === "guests" ? filters.who : "all";
  const page = Math.max(1, filters.page ?? 1);

  const rows = await sql<AdminConversationRow[]>`
    select c.id::text as id, c.title, c.locale, c.updated_at::text as "updatedAt",
      c.user_id::text as "userId", c.guest_id::text as "guestId",
      (select coalesce(to_jsonb(u)->>'email', to_jsonb(u)->>'user_name')
         from identity.asp_net_users u where u.id::text = c.user_id::text) as "userEmail",
      (select count(*)::int from ai.messages m where m.conversation_id = c.id and m.role = 'user') as "userMessages"
    from ai.conversations c
    where exists (select 1 from ai.messages m where m.conversation_id = c.id)
      and (${who} = 'all' or (${who} = 'users' and c.user_id is not null) or (${who} = 'guests' and c.user_id is null))
      and (${like}::text is null or c.title ilike ${like}
           or exists (select 1 from ai.messages m where m.conversation_id = c.id and m.text_content ilike ${like}))
    order by c.updated_at desc
    limit ${ADMIN_PAGE_SIZE + 1} offset ${(page - 1) * ADMIN_PAGE_SIZE}
  `;
  return { rows: rows.slice(0, ADMIN_PAGE_SIZE), hasMore: rows.length > ADMIN_PAGE_SIZE, page };
}

/** Today's numbers for the top of the page. */
export async function getAssistantStatsAdmin() {
  await getAdminSession();
  const [row] = await sql<{ messages: number; conversations: number; guestConversations: number; userConversations: number }[]>`
    select
      (select count(*)::int from ai.messages where role = 'user' and created_at >= current_date) as messages,
      count(*)::int as conversations,
      (count(*) filter (where user_id is null))::int as "guestConversations",
      (count(*) filter (where user_id is not null))::int as "userConversations"
    from ai.conversations
    where updated_at >= current_date
      and exists (select 1 from ai.messages m where m.conversation_id = ai.conversations.id)
  `;
  return row ?? { messages: 0, conversations: 0, guestConversations: 0, userConversations: 0 };
}

/** One chat with all its messages, oldest first. */
export async function getAssistantConversationAdmin(id: string) {
  await getAdminSession();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [conversation] = await sql<AdminConversationRow[]>`
    select c.id::text as id, c.title, c.locale, c.updated_at::text as "updatedAt",
      c.user_id::text as "userId", c.guest_id::text as "guestId",
      (select coalesce(to_jsonb(u)->>'email', to_jsonb(u)->>'user_name')
         from identity.asp_net_users u where u.id::text = c.user_id::text) as "userEmail",
      0 as "userMessages"
    from ai.conversations c where c.id = ${id}::uuid
  `;
  if (!conversation) return null;
  const messages = await sql<{ id: string; role: UIMessage["role"]; parts: UIMessage["parts"]; createdAt: string }[]>`
    select client_message_id as id, role, parts, created_at::text as "createdAt"
    from ai.messages where conversation_id = ${id}::uuid
    order by created_at asc
  `;
  return { conversation, messages };
}