/**
 * Guards the E2E harness itself: if this fails, every other tours spec is
 * meaningless. Seeded users, ledger funding and signed sessions must behave
 * exactly like the real ones.
 */
import { expect, test } from "@playwright/test";

import { seedUser } from "../../src/features/tours/testing/fixtures";

import { closeDb, db, fundWalletViaLedger } from "./support/db";
import { signIn } from "./support/session";

test.afterAll(closeDb);

test("a signed session for a seeded user is accepted by the app", async ({ context, page }) => {
  const user = await seedUser(db());
  await signIn(context, { ...user, roles: ["user"] });
  const res = await page.request.get("/api/auth/session");
  expect(res.status()).toBe(200);
  const session = await res.json();
  expect(session?.user?.id).toBe(user.id);
  expect(session?.user?.roles).toEqual(["user"]);
});

test("wallet funding goes through both ledgers", async () => {
  const user = await seedUser(db());
  fundWalletViaLedger(user.id, "IRR", 5_000_000);
  const [row] = await db()<{ legacy: number; ledger: number }[]>`
    select (select count(*)::int from customer.wallet_transactions where user_id = ${user.id}) as legacy,
           (select count(*)::int from accounting.wallets where user_id = ${user.id}) as ledger`;
  expect(row).toEqual({ legacy: 1, ledger: 1 });
});
