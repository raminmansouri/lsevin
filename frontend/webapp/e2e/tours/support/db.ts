/**
 * Direct database access for E2E setup and verification ("verify the booking
 * exists", "seed a published tour"). Only ever a local database.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import postgres from "postgres";

import { assertLocalDatabase } from "../../../src/features/tours/testing/fixtures";

import { APP_ROOT, E2E_DB_URL } from "./env";

let client: postgres.Sql | null = null;

export function db(): postgres.Sql {
  if (!client) {
    assertLocalDatabase(E2E_DB_URL);
    client = postgres(E2E_DB_URL, { max: 4, onnotice: () => {} });
  }
  return client;
}

export async function closeDb() {
  await client?.end();
  client = null;
}

/**
 * Funds a user's wallet through the platform's own accounting bridge (the same
 * path a real deposit takes) so a wallet payment can settle end to end.
 */
function tsxCli(): string {
  const direct = path.join(APP_ROOT, "node_modules/tsx/dist/cli.mjs");
  if (fs.existsSync(direct)) return direct;
  // tsx is a transitive dependency here; pnpm keeps it under .pnpm/tsx@<version>.
  const store = path.join(APP_ROOT, "node_modules/.pnpm");
  const dir = fs.readdirSync(store).filter((d) => d.startsWith("tsx@")).sort().pop();
  if (!dir) throw new Error("tsx is not installed (needed to fund wallets through the accounting bridge).");
  return path.join(store, dir, "node_modules/tsx/dist/cli.mjs");
}

export function fundWalletViaLedger(userId: string, currency: string, amount: number) {
  const script = path.join(APP_ROOT, "e2e/tours/support/fund-wallet.ts");
  const res = spawnSync(process.execPath, [tsxCli(), "--conditions=react-server", "--tsconfig", path.join(APP_ROOT, "tsconfig.json"), script, userId, currency, String(amount)], {
    cwd: APP_ROOT,
    env: { ...process.env, DATABASE_URL: E2E_DB_URL, NODE_ENV: "test" },
    encoding: "utf8",
  });
  if (res.status !== 0) throw new Error(`fund-wallet failed: ${res.stderr || res.stdout}`);
}
