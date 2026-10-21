import "server-only";

import type { UIMessage } from "ai";

import sql from "@/config/database/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAVED_ROLES = new Set<UIMessage["role"]>(["user", "assistant", "system"]);
const TITLE_MAX_LENGTH = 120;

/** How many messages a returning user gets back; older ones stay in the database. */
const HISTORY_LIMIT = 100;

export function isValidConversationId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** The plain text of a message (text parts only), for the title and text_content. */
export function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/**
 * Makes sure the chat exists and belongs to this user. Creates it on the first message.
 * Returns false when the id is already used by someone else's chat, so nothing gets saved
 * into another user's history.
 */
export async function ensureConversation(input: {
  id: string;
  userId: string;
  locale: string;
  firstMessage?: UIMessage;
}): Promise<boolean> {
  const title = input.firstMessage ? messageText(input.firstMessage).slice(0, TITLE_MAX_LENGTH) || null : null;

  const rows = await sql<{ userId: string }[]>`
    insert into ai.conversations (id, user_id, locale, title)
    values (${input.id}::uuid, ${input.userId}::uuid, ${input.locale}, ${title})
    on conflict (id) do update set updated_at = now()
      where ai.conversations.user_id = excluded.user_id
    returning user_id::text as "userId"
  `;

  return rows[0]?.userId === input.userId;
}

/** Saves messages; a message that is already saved (same chat and message id) is updated. */
export async function saveMessages(conversationId: string, messages: UIMessage[]): Promise<void> {
  for (const message of messages) {
    if (!message?.id || !SAVED_ROLES.has(message.role) || !Array.isArray(message.parts)) continue;

    await sql`
      insert into ai.messages (conversation_id, client_message_id, role, parts, text_content)
      values (
        ${conversationId}::uuid,
        ${message.id},
        ${message.role},
        ${sql.json(message.parts as never)},
        ${messageText(message) || null}
      )
      on conflict (conversation_id, client_message_id) do update
        set parts = excluded.parts,
            text_content = excluded.text_content
    `;
  }

  await sql`update ai.conversations set updated_at = now() where id = ${conversationId}::uuid`;
}

export type ConversationSummary = { id: string; title: string | null; updatedAt: string };

/** The user's chats, newest first, for the "previous chats" list. */
export async function listConversations(userId: string, limit = 50): Promise<ConversationSummary[]> {
  return sql<ConversationSummary[]>`
    select c.id::text as id, c.title, c.updated_at as "updatedAt"
    from ai.conversations c
    where c.user_id = ${userId}::uuid
      and exists (select 1 from ai.messages m where m.conversation_id = c.id)
    order by c.updated_at desc
    limit ${limit}
  `;
}

/** One of the user's chats with its latest messages, oldest first. Null when it isn't theirs. */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<{ id: string; messages: UIMessage[] } | null> {
  if (!isValidConversationId(conversationId)) return null;

  const owned = await sql<{ id: string }[]>`
    select id::text as id
    from ai.conversations
    where id = ${conversationId}::uuid and user_id = ${userId}::uuid
  `;
  if (!owned[0]) return null;

  const rows = await sql<{ id: string; role: UIMessage["role"]; parts: UIMessage["parts"] }[]>`
    select id, role, parts
    from (
      select client_message_id as id, role, parts, created_at
      from ai.messages
      where conversation_id = ${conversationId}::uuid
      order by created_at desc
      limit ${HISTORY_LIMIT}
    ) latest
    order by created_at asc
  `;

  return {
    id: conversationId,
    messages: rows.map((row) => ({ id: row.id, role: row.role, parts: row.parts })),
  };
}

/** The user's most recent chat. Null when they have none. */
export async function getLatestConversation(
  userId: string
): Promise<{ id: string; messages: UIMessage[] } | null> {
  const [latest] = await listConversations(userId, 1);
  return latest ? getConversation(userId, latest.id) : null;
}

/** How much of the user's earlier chats the assistant is reminded of in a new answer. */
const MEMORY_MESSAGE_LIMIT = 30;
const MEMORY_MESSAGE_LENGTH = 300;

/**
 * A short transcript of the user's earlier chats (not the current one), oldest first,
 * so the assistant remembers what they talked about before. Empty when there is nothing.
 */
export async function getEarlierChatsMemory(userId: string, currentConversationId: string): Promise<string> {
  const rows = await sql<{ role: string; text: string; at: Date }[]>`
    select role, text, at
    from (
      select m.role, m.text_content as text, m.created_at as at
      from ai.messages m
      join ai.conversations c on c.id = m.conversation_id
      where c.user_id = ${userId}::uuid
        and c.id <> ${currentConversationId}::uuid
        and m.role in ('user', 'assistant')
        and nullif(m.text_content, '') is not null
      order by m.created_at desc
      limit ${MEMORY_MESSAGE_LIMIT}
    ) recent
    order by at asc
  `;

  return rows
    .map((row) => {
      const date = new Date(row.at).toISOString().slice(0, 10);
      const text = row.text.replace(/\s+/g, " ").slice(0, MEMORY_MESSAGE_LENGTH);
      return `[${date}] ${row.role === "user" ? "User" : "Assistant"}: ${text}`;
    })
    .join("\n");
}
