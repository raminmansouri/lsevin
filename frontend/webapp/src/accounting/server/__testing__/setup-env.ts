/**
 * Loads .env.local into process.env before any test module is imported.
 *
 * @/config/database/db throws at import time when DATABASE_URL is missing, and
 * ledger.service imports it, so this has to run first — hence setupFiles rather than a
 * beforeAll hook.
 *
 * The port is rewritten to the local lsevin-pg container (5442). Tests must never be
 * able to reach production by accident: if DATABASE_URL ever points somewhere remote,
 * set ACCOUNTING_TEST_DATABASE_URL explicitly instead.
 */
import fs from "node:fs";
import path from "node:path";

const APP_ROOT = path.resolve(__dirname, "../../../..");
const ENV_FILE = path.join(APP_ROOT, ".env.local");

if (!process.env.DATABASE_URL && fs.existsSync(ENV_FILE)) {
  const match = fs.readFileSync(ENV_FILE, "utf8").match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
  if (match) {
    const url = new URL(match[1].trim().replace(/^["']|["']$/g, ""));
    url.port = process.env.ACCOUNTING_TEST_DB_PORT ?? "5442";
    process.env.DATABASE_URL = url.toString();
  }
}

if (process.env.ACCOUNTING_TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.ACCOUNTING_TEST_DATABASE_URL;
}

const host = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : "";
if (host && !["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(host)) {
  throw new Error(
    `Refusing to run the accounting tests against a non-local database (${host}). ` +
      "They write and roll back real transactions; point ACCOUNTING_TEST_DATABASE_URL at a local database."
  );
}
