/**
 * Environment for the Tours E2E suite.
 *
 *   TOURS_E2E_DATABASE_URL  local database the app under test uses
 *                           (default postgres://lsevin:lsevin@localhost:5432/lsevin_tours_e2e)
 *   TOURS_E2E_BASE_URL      an already-running app; when unset Playwright starts `next dev` on 3031
 *   TOURS_E2E_AUTH_SECRET   NextAuth secret of that app (default: AUTH_SECRET from .env.local)
 *
 * Prepare the database once with `node scripts/tours-e2e-db.mjs` (see e2e/tours/README.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function fromEnvLocal(key: string): string | undefined {
  const file = path.join(APP_ROOT, ".env.local");
  if (!fs.existsSync(file)) return undefined;
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)\\s*$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
}

export const E2E_DB_URL = process.env.TOURS_E2E_DATABASE_URL || "postgres://lsevin:lsevin@localhost:5432/lsevin_tours_e2e";
export const E2E_PORT = Number(process.env.TOURS_E2E_PORT || 3031);
export const E2E_BASE_URL = process.env.TOURS_E2E_BASE_URL || `http://localhost:${E2E_PORT}`;
export const E2E_AUTH_SECRET = process.env.TOURS_E2E_AUTH_SECRET || process.env.AUTH_SECRET || fromEnvLocal("AUTH_SECRET") || "";
export const E2E_INTERNAL_KEY = process.env.TOURS_INTERNAL_API_KEY || "tours-e2e-internal-key-0123456789abcdef";
export { APP_ROOT };
