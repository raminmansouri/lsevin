/**
 * CLI: fund a wallet in both ledgers via the platform's deposit path.
 *   tsx --conditions=react-server e2e/tours/support/fund-wallet.ts <userId> <currency> <amount>
 * DATABASE_URL must point at a local database.
 */
import postgres from "postgres";

import { assertLocalDatabase, fundWallet } from "../../../src/features/tours/testing/fixtures";

async function main() {
  const [userId, currency, amount] = process.argv.slice(2);
  const url = process.env.DATABASE_URL!;
  assertLocalDatabase(url);
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await fundWallet(sql, userId, currency, Number(amount));
  await sql.end();
  const { mirrorWalletCredit } = await import("../../../src/accounting/server/legacy-bridge");
  const appDb = (await import("../../../src/config/database/db")).default;
  await appDb.begin((tx) => mirrorWalletCredit({
    userId, currencyCode: currency, amount: String(amount), idempotencyKey: `e2e-deposit-${userId}-${Date.now()}`,
    sourceType: "deposit", counterpartAccountKey: "bank_platform", description: "tours e2e deposit",
  }, tx as never));
  await appDb.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
