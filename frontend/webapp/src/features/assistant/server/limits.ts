import "server-only";

import { createHash } from "node:crypto";

import sql from "@/config/database/db";

export type AssistantSettings = {
  guestDailyMessages: number;
  userDailyMessages: number;
  guestMessagesPerChat: number;
  userMessagesPerChat: number;
  guestMaxChars: number;
  userMaxChars: number;
  saveGuestChats: boolean;
};

/** Used when the settings row can't be read (e.g. migration 0090 not applied yet). */
const DEFAULTS: AssistantSettings = {
  guestDailyMessages: 10,
  userDailyMessages: 50,
  guestMessagesPerChat: 10,
  userMessagesPerChat: 40,
  guestMaxChars: 500,
  userMaxChars: 1500,
  saveGuestChats: true,
};

let cache: { at: number; value: AssistantSettings } | null = null;

/** The admin-set settings, cached for a minute so every message doesn't hit the database. */
export async function getAssistantSettings(fresh = false): Promise<AssistantSettings> {
  if (!fresh && cache && Date.now() - cache.at < 60_000) return cache.value;
  try {
    const [row] = await sql<AssistantSettings[]>`
      select guest_daily_messages as "guestDailyMessages", user_daily_messages as "userDailyMessages",
        guest_messages_per_chat as "guestMessagesPerChat", user_messages_per_chat as "userMessagesPerChat",
        guest_max_chars as "guestMaxChars", user_max_chars as "userMaxChars",
        save_guest_chats as "saveGuestChats"
      from ai.settings where id = 1
    `;
    const value = row ?? DEFAULTS;
    cache = { at: Date.now(), value };
    return value;
  } catch (error) {
    console.error("[assistant] could not read settings", error);
    return DEFAULTS;
  }
}

/** Called after an admin saves the settings, so they apply at once. */
export function forgetAssistantSettings() {
  cache = null;
}

export type LimitVerdict = "ok" | "too_long" | "chat_full" | "daily_limit";

/** Counts one message for this subject today and returns today's total. */
async function countToday(subject: string): Promise<number> {
  const [row] = await sql<{ messages: number }[]>`
    insert into ai.usage_daily (day, subject, messages)
    values (current_date, ${subject}, 1)
    on conflict (day, subject) do update set messages = ai.usage_daily.messages + 1
    returning messages
  `;
  return Number(row?.messages ?? 0);
}

/**
 * Whether this message may go to the model. Guests are counted by their cookie id and,
 * since a cookie can be cleared, by a hash of their IP with three times the guest limit
 * (several people can share one connection). 0 in any setting means no limit.
 * Fails open: a database problem never blocks the assistant.
 */
export async function checkAssistantLimits(input: {
  userId: string | null;
  guestId: string | null;
  ip: string | null;
  userMessagesInChat: number;
  textLength: number;
}): Promise<{ verdict: LimitVerdict; settings: AssistantSettings }> {
  const settings = await getAssistantSettings();
  const guest = !input.userId;
  const maxChars = guest ? settings.guestMaxChars : settings.userMaxChars;
  const perChat = guest ? settings.guestMessagesPerChat : settings.userMessagesPerChat;
  const daily = guest ? settings.guestDailyMessages : settings.userDailyMessages;

  if (maxChars > 0 && input.textLength > maxChars) return { verdict: "too_long", settings };
  if (perChat > 0 && input.userMessagesInChat > perChat) return { verdict: "chat_full", settings };
  if (daily <= 0) return { verdict: "ok", settings };

  const subjects: Array<{ key: string; limit: number }> = guest
    ? [
        ...(input.guestId ? [{ key: `guest:${input.guestId}`, limit: daily }] : []),
        ...(input.ip
          ? [{ key: `ip:${createHash("sha256").update(input.ip).digest("hex").slice(0, 32)}`, limit: daily * 3 }]
          : []),
      ]
    : [{ key: `user:${input.userId}`, limit: daily }];

  try {
    for (const subject of subjects) {
      if ((await countToday(subject.key)) > subject.limit) return { verdict: "daily_limit", settings };
    }
  } catch (error) {
    console.error("[assistant] could not count usage", error);
  }
  return { verdict: "ok", settings };
}

const REPLIES: Record<string, Record<Exclude<LimitVerdict, "ok"> | "daily_limit_guest", string>> = {
  fa: {
    too_long: "پیامتان کمی طولانی است؛ لطفاً کوتاه‌تر بنویسید (حداکثر {n} کاراکتر).",
    chat_full: "این گفتگو به حداکثر طول خودش رسیده. برای ادامه، یک گفتگوی جدید شروع کنید.",
    daily_limit: "به سقف پیام‌های امروز رسیدید. فردا دوباره در خدمتتان هستیم؛ برای کارهای فوری با پشتیبانی تماس بگیرید.",
    daily_limit_guest: "به سقف پیام‌های امروز برای مهمان‌ها رسیدید. برای ادامهٔ گفتگو، وارد حساب کاربری خود شوید.",
  },
  en: {
    too_long: "Your message is a bit long; please keep it under {n} characters.",
    chat_full: "This chat has reached its maximum length. Please start a new chat to continue.",
    daily_limit: "You've reached today's message limit. We'll be happy to help again tomorrow; for anything urgent, contact support.",
    daily_limit_guest: "You've reached today's message limit for guests. Sign in to your account to keep chatting.",
  },
  ar: {
    too_long: "رسالتك طويلة بعض الشيء؛ يرجى ألا تتجاوز {n} حرفًا.",
    chat_full: "وصلت هذه المحادثة إلى حدها الأقصى. يرجى بدء محادثة جديدة للمتابعة.",
    daily_limit: "لقد وصلت إلى حد الرسائل لليوم. يسعدنا مساعدتك غدًا؛ وللأمور العاجلة تواصل مع الدعم.",
    daily_limit_guest: "لقد وصلت إلى حد رسائل الزوار لليوم. سجّل الدخول إلى حسابك لمتابعة المحادثة.",
  },
};

/** The polite answer shown instead of calling the model. */
export function limitReply(verdict: Exclude<LimitVerdict, "ok">, locale: string, guest: boolean, settings: AssistantSettings) {
  const texts = REPLIES[locale] ?? REPLIES.en;
  const key = verdict === "daily_limit" && guest ? "daily_limit_guest" : verdict;
  const n = guest ? settings.guestMaxChars : settings.userMaxChars;
  return texts[key].replace("{n}", new Intl.NumberFormat(locale).format(n));
}