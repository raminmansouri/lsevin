import "server-only";

import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

import { cookies, headers } from "next/headers";

import db from "@/config/database/db";

// promisify's overloads do not cover scrypt's 4-argument form with options.
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derived) =>
      err ? reject(err) : resolve(derived as Buffer)
    );
  });
}

/**
 * Authentication for the financial panel (financial.lsevin.com).
 *
 * Completely separate from the customer/admin NextAuth session: its own user table, its
 * own cookie name, its own sign-in page. An accountant signs in here without holding an
 * account that can reach the rest of the platform, and a compromised admin account does
 * not hand over the ledger.
 */

export const PANEL_COOKIE = "lsevin_financial_session";
const SESSION_HOURS = 8;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// scrypt parameters. N=2^15 costs ~32 MB and tens of milliseconds per hash — slow enough
// to make offline guessing expensive, fast enough that a login is not noticeable.
const SCRYPT_N = 32768;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEY_LEN = 64;

export type PanelUser = {
  id: string;
  username: string;
  displayName: string;
  role: "accountant" | "finance_admin";
  mustChangePassword: boolean;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
    maxmem: 128 * SCRYPT_N * SCRYPT_r * 2,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");

  const key = await scrypt(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  });

  // Constant-time: a plain === leaks how much of the hash matched via timing.
  return key.length === expected.length && timingSafeEqual(key, expected);
}

async function requestContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  return {
    ip: forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent") ?? null,
  };
}

async function recordAttempt(username: string, succeeded: boolean, reason: string | null) {
  const { ip, userAgent } = await requestContext();
  await db`
    insert into accounting.panel_login_attempts (username, succeeded, reason, ip_address, user_agent)
    values (${username}, ${succeeded}, ${reason}, ${ip}::inet, ${userAgent})
  `;
}

export type SignInResult =
  | { ok: true; user: PanelUser }
  | { ok: false; reason: "invalid" | "locked" | "inactive" };

/**
 * Verifies credentials and opens a session.
 *
 * The failure path deliberately returns the same "invalid" for an unknown username and a
 * wrong password, and hashes a dummy value when the user does not exist — otherwise the
 * response time tells an attacker which usernames are real.
 */
export async function signIn(input: { username: string; password: string }): Promise<SignInResult> {
  const username = input.username.trim();

  const [user] = await db<
    {
      id: string;
      username: string;
      display_name: string;
      role: PanelUser["role"];
      password_hash: string;
      is_active: boolean;
      failed_attempts: number;
      locked_until: Date | null;
      must_change_password: boolean;
    }[]
  >`
    select id::text as id, username, display_name, role, password_hash, is_active,
           failed_attempts, locked_until, must_change_password
    from accounting.panel_users
    where lower(username) = lower(${username})
    limit 1
  `;

  if (!user) {
    // Same work as a real verification, so timing does not reveal that the user is absent.
    await verifyPassword(input.password, await hashPassword("no-such-user"));
    await recordAttempt(username, false, "unknown_user");
    return { ok: false, reason: "invalid" };
  }

  if (!user.is_active) {
    await recordAttempt(username, false, "inactive");
    return { ok: false, reason: "inactive" };
  }

  if (user.locked_until && user.locked_until > new Date()) {
    await recordAttempt(username, false, "locked");
    return { ok: false, reason: "locked" };
  }

  if (!(await verifyPassword(input.password, user.password_hash))) {
    const attempts = user.failed_attempts + 1;
    await db`
      update accounting.panel_users
         set failed_attempts = ${attempts},
             -- make_interval takes a bound parameter; interpolating into a quoted
             -- interval literal would be parameterised inside the quotes and break.
             locked_until = ${
               attempts >= MAX_FAILED_ATTEMPTS
                 ? db`now() + make_interval(mins => ${LOCKOUT_MINUTES})`
                 : null
             },
             updated_at = now()
       where id = ${user.id}
    `;
    await recordAttempt(username, false, "bad_password");
    return { ok: false, reason: attempts >= MAX_FAILED_ATTEMPTS ? "locked" : "invalid" };
  }

  const { ip, userAgent } = await requestContext();
  const [session] = await db<{ id: string }[]>`
    insert into accounting.panel_sessions (user_id, expires_at, ip_address, user_agent)
    values (${user.id}, now() + make_interval(hours => ${SESSION_HOURS}), ${ip}::inet, ${userAgent})
    returning id::text as id
  `;

  await db`
    update accounting.panel_users
       set failed_attempts = 0, locked_until = null, last_login_at = now(), updated_at = now()
     where id = ${user.id}
  `;
  await recordAttempt(username, true, null);

  const jar = await cookies();
  jar.set(PANEL_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Strict, not Lax: nothing should ever navigate into this panel from another site.
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      mustChangePassword: user.must_change_password,
    },
  };
}

/** Resolves the signed-in panel user, or null. Also slides last_seen_at. */
export async function getPanelUser(): Promise<PanelUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(PANEL_COOKIE)?.value;
  if (!sessionId) return null;

  const [row] = await db<
    {
      id: string;
      username: string;
      display_name: string;
      role: PanelUser["role"];
      must_change_password: boolean;
    }[]
  >`
    update accounting.panel_sessions s
       set last_seen_at = now()
      from accounting.panel_users u
     where s.id = ${sessionId}::uuid
       and s.user_id = u.id
       and s.revoked_at is null
       and s.expires_at > now()
       and u.is_active = true
    returning u.id::text as id, u.username, u.display_name, u.role, u.must_change_password
  `.catch(() => []);

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
  };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(PANEL_COOKIE)?.value;

  if (sessionId) {
    // Revoked server-side, not just cleared from the browser — clearing a cookie does
    // not stop anyone who copied it.
    await db`
      update accounting.panel_sessions
         set revoked_at = now(), revoke_reason = 'signed out'
       where id = ${sessionId}::uuid and revoked_at is null
    `.catch(() => undefined);
  }
  jar.delete(PANEL_COOKIE);
}

export async function changePassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (input.newPassword.length < 10) {
    return { ok: false, reason: "too_short" };
  }

  const [user] = await db<{ password_hash: string }[]>`
    select password_hash from accounting.panel_users where id = ${input.userId} limit 1
  `;
  if (!user || !(await verifyPassword(input.currentPassword, user.password_hash))) {
    return { ok: false, reason: "invalid_current" };
  }

  const hash = await hashPassword(input.newPassword);
  await db.begin(async (tx) => {
    await tx`
      update accounting.panel_users
         set password_hash = ${hash}, must_change_password = false,
             password_changed_at = now(), updated_at = now()
       where id = ${input.userId}
    `;
    // Every other session for this user dies with the old password.
    await tx`
      update accounting.panel_sessions
         set revoked_at = now(), revoke_reason = 'password changed'
       where user_id = ${input.userId} and revoked_at is null
    `;
  });

  return { ok: true };
}
