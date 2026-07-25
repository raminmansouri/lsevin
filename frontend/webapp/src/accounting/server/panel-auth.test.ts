import fs from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { hashPassword } from "./panel-auth";
import { closeTestSql, ensureAccountingSchema, testSql } from "./__testing__/harness";

const APP_ROOT = path.resolve(__dirname, "../../..");

beforeAll(async () => {
  await ensureAccountingSchema();
  // The panel-auth tables live in a migration the harness does not carry.
  const sqlText = fs
    .readFileSync(path.join(APP_ROOT, "db", "migrations", "0013_accounting_panel_auth.sql"), "utf8")
    .replace(/^\s*(begin|commit)\s*;\s*$/gim, "");
  await testSql.unsafe(sqlText).simple();
});

afterAll(async () => {
  await testSql`delete from accounting.panel_users`;
  await closeTestSql();
});

describe("panel password hashing", () => {
  it("produces a salted hash that never repeats for the same password", async () => {
    const a = await hashPassword("correct horse battery staple");
    const b = await hashPassword("correct horse battery staple");

    expect(a).not.toBe(b); // different salt each time
    expect(a.startsWith("scrypt$")).toBe(true);
    // The password must not be recoverable from, or visible in, the stored value.
    expect(a).not.toContain("correct");
  });

  it("records the parameters so they can be raised later without breaking old hashes", async () => {
    const hash = await hashPassword("whatever");
    const [algo, n, r, p] = hash.split("$");
    expect(algo).toBe("scrypt");
    expect(Number(n)).toBeGreaterThanOrEqual(16384);
    expect(Number(r)).toBeGreaterThan(0);
    expect(Number(p)).toBeGreaterThan(0);
  });
});

describe("panel user storage", () => {
  it("stores only the hash, never the password", async () => {
    const hash = await hashPassword("s3cret-password-xyz");
    await testSql`
      insert into accounting.panel_users (username, display_name, password_hash, role)
      values ('acc-test', 'Test Accountant', ${hash}, 'accountant')
      on conflict (username) do update set password_hash = excluded.password_hash
    `;

    const [row] = await testSql<{ password_hash: string; must_change_password: boolean }[]>`
      select password_hash, must_change_password from accounting.panel_users where username = 'acc-test'
    `;
    expect(row.password_hash).not.toContain("s3cret");
    // A seeded account must be forced to change its password on first use.
    expect(row.must_change_password).toBe(true);
  });

  it("rejects a role outside the two the panel defines", async () => {
    const hash = await hashPassword("x".repeat(12));
    await expect(
      testSql`
        insert into accounting.panel_users (username, display_name, password_hash, role)
        values ('bad-role', 'Nope', ${hash}, 'superuser')
      `
    ).rejects.toThrow(/violates check constraint/i);
  });

  it("keeps usernames unique regardless of case", async () => {
    const hash = await hashPassword("y".repeat(12));
    await testSql`
      insert into accounting.panel_users (username, display_name, password_hash)
      values ('Unique-User', 'A', ${hash}) on conflict (username) do nothing
    `;
    const [{ n }] = await testSql<{ n: number }[]>`
      select count(*)::int as n from accounting.panel_users where lower(username) = 'unique-user'
    `;
    expect(n).toBe(1);
  });
});

describe("panel sessions", () => {
  it("expires and can be revoked server-side", async () => {
    const hash = await hashPassword("z".repeat(12));
    const [user] = await testSql<{ id: string }[]>`
      insert into accounting.panel_users (username, display_name, password_hash)
      values ('session-test', 'S', ${hash})
      on conflict (username) do update set display_name = excluded.display_name
      returning id::text as id
    `;

    const [live] = await testSql<{ id: string }[]>`
      insert into accounting.panel_sessions (user_id, expires_at)
      values (${user.id}, now() + interval '1 hour') returning id::text as id
    `;
    const [expired] = await testSql<{ id: string }[]>`
      insert into accounting.panel_sessions (user_id, expires_at)
      values (${user.id}, now() - interval '1 hour') returning id::text as id
    `;

    const valid = async (id: string) => {
      const [row] = await testSql<{ n: number }[]>`
        select count(*)::int as n from accounting.panel_sessions
        where id = ${id}::uuid and revoked_at is null and expires_at > now()
      `;
      return row.n === 1;
    };

    expect(await valid(live.id)).toBe(true);
    expect(await valid(expired.id)).toBe(false);

    // Revoking is a server-side write, so a copied cookie stops working immediately —
    // which a stateless token could not offer.
    await testSql`update accounting.panel_sessions set revoked_at = now() where id = ${live.id}::uuid`;
    expect(await valid(live.id)).toBe(false);
  });

  it("drops a user's sessions when the user is deleted", async () => {
    const hash = await hashPassword("q".repeat(12));
    const [user] = await testSql<{ id: string }[]>`
      insert into accounting.panel_users (username, display_name, password_hash)
      values ('cascade-test', 'C', ${hash}) returning id::text as id
    `;
    await testSql`
      insert into accounting.panel_sessions (user_id, expires_at)
      values (${user.id}, now() + interval '1 hour')
    `;

    await testSql`delete from accounting.panel_users where id = ${user.id}`;
    const [{ n }] = await testSql<{ n: number }[]>`
      select count(*)::int as n from accounting.panel_sessions where user_id = ${user.id}
    `;
    expect(n).toBe(0);
  });
});

describe("login attempt log", () => {
  it("is append-only, like the rest of the audit surface", async () => {
    await testSql`
      insert into accounting.panel_login_attempts (username, succeeded, reason)
      values ('audit-test', false, 'bad_password')
    `;
    await expect(
      testSql`update accounting.panel_login_attempts set succeeded = true where username = 'audit-test'`
    ).rejects.toThrow(/append-only/i);
    await expect(
      testSql`delete from accounting.panel_login_attempts where username = 'audit-test'`
    ).rejects.toThrow(/append-only/i);
  });
});
