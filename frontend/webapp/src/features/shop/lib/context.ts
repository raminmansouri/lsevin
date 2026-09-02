import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import sql from "@/config/database/db";
import { getSession } from "@/lib/auth/session";
import { getAdminContext } from "@/lib/auth/admin-guard";

/**
 * Cross-cutting request context for every Shop surface.
 *
 * Shop reuses the platform's identity, session and regional primitives — it does
 * not invent its own (SHP-BASE-003). The only Shop-specific piece is the guest
 * cart token: an opaque, cryptographically strong cookie so a not-yet-signed-in
 * visitor still gets a durable cart (SHP-CART-002, SHP-V01-010).
 */

export const SHOP_GUEST_COOKIE = "lsevin_shop_gid";
export const SHOP_CURRENCY_COOKIE = "lsevin_shop_ccy";
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export type ShopContext = {
  /** identity.asp_net_users.id — what the session stores. null for guests. */
  userId: string | null;
  /** customer.customers.id — FK target of shop.orders.customer_id. null for guests / unresolved. */
  customerId: string | null;
  /** Signed-in user's email, when the session carries one. Used to pre-fill and
   *  to match orders that were placed before a customer row existed. */
  email: string | null;
  /** Opaque guest cart token from the cookie; always present (created if missing). */
  guestToken: string;
  /** Active UI locale (fa | ar | en | ...). */
  locale: string;
  /** ISO2 country the customer is shopping from, best-effort. */
  countryCode: string | null;
  /** Explicitly selected display currency (cookie), if any. */
  selectedCurrencyCode: string | null;
  isAdmin: boolean;
};

function normalizeLocaleValue(value?: string | null): string {
  const v = (value || "").trim().toLowerCase();
  if (!v) return "fa";
  return v.split("-")[0];
}

export function normalizeLocale(locale?: string): string {
  return normalizeLocaleValue(locale);
}

async function resolveLocale(): Promise<string> {
  const h = await headers();
  const fromHeader =
    h.get("x-next-intl-locale") ||
    h.get("x-locale") ||
    h.get("x-lsevin-locale");
  if (fromHeader) return normalizeLocaleValue(fromHeader);
  const c = await cookies();
  return normalizeLocaleValue(
    c.get("LSEVIN_LOCALE")?.value || c.get("NEXT_LOCALE")?.value || "fa"
  );
}

/**
 * Maps a signed-in user's IDENTITY id to their CUSTOMER id. Same resolution the
 * favourites / profile surfaces use (see
 * src/features/favorites/server/favorites.repository.ts): exact id match first —
 * some flows already carry a customer id — then match identity→customer by email
 * or phone. Returns null when unresolved (a brand-new account with no customer
 * row yet); the caller treats that as "guest with a session".
 */
export const resolveShopCustomerId = cache(async (userId?: string | null): Promise<string | null> => {
  const raw = String(userId || "").trim();
  if (!UUID_RE.test(raw)) return null;

  const exact = await sql<{ id: string }[]>`
    select id::text as id from customer.customers where id = ${raw}::uuid limit 1
  `;
  if (exact[0]?.id) return exact[0].id;

  const matched = await sql<{ id: string }[]>`
    select c.id::text as id
    from identity.asp_net_users u
    join customer.customers c
      on (
        (nullif(c.email, '') is not null and lower(c.email) = lower(u.email))
        or (
          nullif(c.phone_number, '') is not null
          and c.phone_number = u.phone_number
          and c.phone_number_country_code = u.phone_number_country_code
        )
      )
    where u.id = ${raw}::uuid
    order by case when lower(c.email) = lower(u.email) then 0 else 1 end
    limit 1
  `;
  return matched[0]?.id || null;
});

async function resolveCountryCode(userId: string | null, customerId: string | null): Promise<string | null> {
  if (customerId) {
    const rows = await sql<{ country: string | null }[]>`
      select country from customer.customers where id = ${customerId}::uuid limit 1
    `;
    const c = rows[0]?.country?.trim();
    if (c && c.length <= 3) return c.toUpperCase();
    if (c && c.length > 3) {
      // stored as a name in some rows — map the common ones, otherwise ignore
      const byName: Record<string, string> = { turkey: "TR", iran: "IR", "united states": "US", germany: "DE", "united kingdom": "GB", "united arab emirates": "AE" };
      return byName[c.toLowerCase()] ?? null;
    }
  }
  if (userId) {
    const rows = await sql<{ country: string | null }[]>`
      select country from identity.asp_net_users where id = ${userId}::uuid limit 1
    `;
    const c = rows[0]?.country?.trim();
    if (c && c.length <= 3) return c.toUpperCase();
  }
  const h = await headers();
  const geo = h.get("x-country") || h.get("cf-ipcountry") || h.get("x-vercel-ip-country");
  if (geo && geo.length === 2) return geo.toUpperCase();
  return null;
}

/**
 * The per-request Shop context. `cache()`d so repeated calls in one render tree
 * do not re-hit the session / database.
 */
export const getShopContext = cache(async (): Promise<ShopContext> => {
  const [session, adminCtx, locale, cookieStore] = await Promise.all([
    getSession().catch(() => null),
    getAdminContext().catch(() => ({ isAdmin: false } as { isAdmin: boolean })),
    resolveLocale(),
    cookies(),
  ]);

  const userId = session?.user?.id ?? null;
  const email = (session?.user?.email as string | undefined)?.trim().toLowerCase() || null;
  const customerId = userId ? await resolveShopCustomerId(userId) : null;
  const countryCode = await resolveCountryCode(userId, customerId);

  const guestToken = cookieStore.get(SHOP_GUEST_COOKIE)?.value?.trim() || "";
  const selectedCurrencyCode = cookieStore.get(SHOP_CURRENCY_COOKIE)?.value?.trim()?.toUpperCase() || null;

  return {
    userId,
    customerId,
    email,
    guestToken: guestToken || "",
    locale,
    countryCode,
    selectedCurrencyCode,
    isAdmin: Boolean(adminCtx.isAdmin),
  };
});

/**
 * Reads the guest token, minting and setting the cookie when absent. Only call
 * from a Server Action or Route Handler — Server Components cannot set cookies.
 */
export async function ensureGuestToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SHOP_GUEST_COOKIE)?.value?.trim();
  if (existing) return existing;

  const token = `g_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  store.set(SHOP_GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return token;
}

export async function setSelectedCurrencyCookie(code: string): Promise<void> {
  const store = await cookies();
  store.set(SHOP_CURRENCY_COOKIE, code.trim().toUpperCase(), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
}

/** Authorization boundary for Shop admin server actions (SHP-ADM-017). */
export async function assertShopAdmin(): Promise<{ userId?: string; roles: string[] }> {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) {
    throw new Error("Forbidden: Shop administration requires an admin role.");
  }
  return { userId: ctx.userId, roles: ctx.roles };
}
