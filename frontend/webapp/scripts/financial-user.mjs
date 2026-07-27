#!/usr/bin/env node
/**
 * Create or reset a financial-panel account.
 *
 *   pnpm financial:user create <username> "<display name>" [accountant|finance_admin]
 *   pnpm financial:user reset  <username>
 *
 * The password is generated here and printed once. It is never taken as an argument,
 * because a password on the command line ends up in shell history and in `ps` output
 * for every other user on the box. The account is created with must_change_password,
 * so the printed value only survives until first sign-in.
 */
import { createRequire } from "node:module";
import { randomBytes, randomInt, scrypt as scryptCb } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const postgres = require("postgres");

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of [".env.local", ".env"]) {
    const p = path.join(APP_ROOT, f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("DATABASE_URL is not set.");
}

const scrypt = (password, salt, keylen, options) =>
  new Promise((res, rej) => scryptCb(password, salt, keylen, options, (e, k) => (e ? rej(e) : res(k))));

async function hashPassword(password) {
  const N = 32768, r = 8, p = 1;
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N, r, p, maxmem: 128 * N * r * 2 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

// Avoids look-alike characters, so a password read off a screen is typed correctly.
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generatePassword = () =>
  Array.from({ length: 20 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

const [command, username, displayName, role = "accountant"] = process.argv.slice(2);

if (!command || !username) {
  console.error("usage: financial-user.mjs create <username> \"<display name>\" [accountant|finance_admin]");
  console.error("       financial-user.mjs reset  <username>");
  process.exit(1);
}

const sql = postgres(databaseUrl(), { max: 1, prepare: false });

try {
  const password = generatePassword();
  const hash = await hashPassword(password);

  if (command === "create") {
    if (!displayName) throw new Error("A display name is required.");
    if (!["accountant", "finance_admin"].includes(role)) {
      throw new Error("Role must be accountant or finance_admin.");
    }
    await sql`
      insert into accounting.panel_users (username, display_name, password_hash, role)
      values (${username}, ${displayName}, ${hash}, ${role})
    `;
    console.log(`\ncreated ${role} "${displayName}"`);
  } else if (command === "reset") {
    const rows = await sql`
      update accounting.panel_users
         set password_hash = ${hash}, must_change_password = true,
             failed_attempts = 0, locked_until = null, password_changed_at = now(), updated_at = now()
       where lower(username) = lower(${username})
      returning id
    `;
    if (!rows.length) throw new Error(`No panel user named "${username}".`);
    // Every existing session dies with the old password.
    await sql`
      update accounting.panel_sessions
         set revoked_at = now(), revoke_reason = 'password reset'
       where user_id = ${rows[0].id} and revoked_at is null
    `;
    console.log(`\npassword reset for "${username}" — existing sessions revoked`);
  } else {
    throw new Error(`Unknown command "${command}".`);
  }

  console.log(`  username: ${username}`);
  console.log(`  password: ${password}`);
  console.log("\nShown once. It must be changed at first sign-in.\n");
} catch (error) {
  console.error(`\nfailed: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
