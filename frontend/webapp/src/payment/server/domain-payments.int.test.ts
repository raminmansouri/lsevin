import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

/**
 * Real-Postgres tests for the per-domain settings (migration 0107): Zibal tokens per domain
 * through the gateway repository, gateway selection per domain, a Zibal wallet top-up end to
 * end (initiate -> verify -> wallet credit -> ledger on clearing_zibal), and the Enamad seal
 * admin actions. Zibal itself is replaced by a fetch stub; the database is real.
 *
 * Opt-in: needs ACCOUNTING_TEST_DATABASE_URL pointing at a LOCAL database with migrations up to
 * 0107 (`pnpm test:local-env --suite domain-settings`). Gateway rows are restored afterwards.
 */

const request = vi.hoisted(() => ({ host: "lsevincare.com", headerReads: 0 }));
vi.mock("next/headers", () => ({
  headers: async () => {
    request.headerReads += 1;
    return new Headers({ "x-forwarded-host": request.host, "x-forwarded-proto": "https" });
  },
}));
const admin = vi.hoisted(() => ({ isAdmin: true, userId: "0e2e0000-0000-4000-8000-0000000000ad" }));
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: vi.fn(async () => ({ userId: admin.userId, roles: admin.isAdmin ? ["admin"] : [], isAdmin: admin.isAdmin })),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const LOCAL = url ? ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname) : false;
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

const MIGRATION = path.join(__dirname, "../../../db/migrations/0107_domain_enamad_and_zibal.sql");
const tag = `it${Date.now().toString(36)}`;
const userId = randomUUID();
type GatewayRow = { code: string; is_enabled: boolean; sort_order: number; settings: unknown };
let originalGateways: GatewayRow[] = [];

type Modules = {
  repo: typeof import("./payment-gateway.repository");
  wallet: typeof import("@/features/wallet/payment-gateway");
  callback: typeof import("@/features/wallet/payment-callback");
  sealActions: typeof import("@/features/trust-seal/actions");
  sealRepo: typeof import("@/features/trust-seal/server/repository");
};
let m: Modules;

// A stand-in for gateway.zibal.ir: remembers which merchant started which trackId.
const zibal = { next: 5_000_001, payments: new Map<number, { merchant: string; amount: number; callbackUrl: string }>() };
const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const target = String(input);
  const body = JSON.parse(String(init?.body ?? "{}"));
  const reply = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
  if (target.endsWith("/v1/request")) {
    const trackId = zibal.next++;
    zibal.payments.set(trackId, { merchant: body.merchant, amount: body.amount, callbackUrl: body.callbackUrl });
    return reply({ result: 100, trackId });
  }
  if (target.endsWith("/v1/verify")) {
    const payment = zibal.payments.get(Number(body.trackId));
    if (!payment) return reply({ result: 203 });
    if (payment.merchant !== body.merchant) return reply({ result: 102 });
    return reply({ result: 100, status: 1, amount: payment.amount, refNumber: 4242, cardNumber: "6037****0000" });
  }
  throw new Error(`unexpected fetch ${target}`);
});

async function setZibal(update: { enabled: boolean; sortOrder?: number; merchants?: Array<{ host: string; merchant: string }>; sandbox?: boolean }) {
  await m.repo.savePaymentGatewayConfig({
    code: "zibal",
    displayName: "Zibal",
    isEnabled: update.enabled,
    sortOrder: update.sortOrder ?? 5,
    settings: {
      sandbox: update.sandbox ?? false,
      currency: "IRR",
      minimumAmount: 10_000,
      enabledContexts: ["booking_online_card", "wallet_topup"],
      ...(update.merchants ? { domainMerchants: update.merchants } : {}),
    },
  });
}

d("per-domain settings (real database)", () => {
  beforeAll(async () => {
    vi.stubGlobal("fetch", fetchMock);
    m = {
      repo: await import("./payment-gateway.repository"),
      wallet: await import("@/features/wallet/payment-gateway"),
      callback: await import("@/features/wallet/payment-callback"),
      sealActions: await import("@/features/trust-seal/actions"),
      sealRepo: await import("@/features/trust-seal/server/repository"),
    };
    await m.repo.ensurePaymentGatewayTable();
    originalGateways = await sql!<GatewayRow[]>`select code, is_enabled, sort_order, settings from booking.payment_gateways`;
    await sql!`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
               values (${userId}, 'Zibal', 'Customer', 'IR', ${tag}, ${tag.toUpperCase()}, ${`${tag}@example.com`}, ${`${tag.toUpperCase()}@EXAMPLE.COM`}, true, ${`0912${Date.now().toString().slice(-7)}`}, true, false, false, 0)`;
  });

  beforeEach(() => {
    request.host = "lsevincare.com";
    request.headerReads = 0;
    admin.isAdmin = true;
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    if (!sql) return;
    for (const row of originalGateways) {
      await sql`update booking.payment_gateways set is_enabled = ${row.is_enabled}, sort_order = ${row.sort_order}, settings = ${sql.json(row.settings as never)} where code = ${row.code}`;
    }
    await sql`delete from content.domain_trust_seals where host like ${`%.${tag}.test`}`;
    // Ledger rows are append-only by design; the test user and its wallet stay in this disposable database.
    await sql.end();
  });

  describe("migration 0107", () => {
    it("creates the Zibal row disabled, with the same fixed id on every site", async () => {
      const [row] = await sql!<{ id: string; ok: boolean }[]>`
        select id::text, id = md5('lsevin:payment-gateway:zibal')::uuid as ok from booking.payment_gateways where code = 'zibal'`;
      expect(row?.ok).toBe(true);
      const [original] = originalGateways.filter((item) => item.code === "zibal");
      expect(original).toBeDefined();
    });

    it("keeps lsevincare.com's seal and gives Zibal its own clearing account next to Zarinpal's", async () => {
      const [seal] = await sql!`select enamad_id from content.domain_trust_seals where host = 'lsevincare.com'`;
      expect(seal?.enamad_id).toBe("7764782");
      const accounts = await sql!<{ system_key: string; parent_id: string | null; account_type: string; id_ok: boolean }[]>`
        select system_key, parent_id::text, account_type, id = md5('lsevin:accounting:clearing_zibal')::uuid as id_ok
        from accounting.accounts where system_key in ('clearing_zarinpal', 'clearing_zibal') order by system_key`;
      expect(accounts.map((a) => a.system_key)).toEqual(["clearing_zarinpal", "clearing_zibal"]);
      expect(accounts[1]!.parent_id).toBe(accounts[0]!.parent_id);
      expect(accounts[1]!.account_type).toBe("asset");
      expect(accounts[1]!.id_ok).toBe(true);
    });

    it("can run again without changing anything", async () => {
      const before = await sql!`select count(*)::int as n from accounting.accounts where system_key = 'clearing_zibal'`;
      // The file is its own transaction (begin/commit): run it on one dedicated connection.
      const single = postgres(url as string, { max: 1, prepare: false });
      try {
        await single.unsafe(fs.readFileSync(MIGRATION, "utf8")).simple();
      } finally {
        await single.end();
      }
      const after = await sql!`select count(*)::int as n from accounting.accounts where system_key = 'clearing_zibal'`;
      expect(after[0]!.n).toBe(before[0]!.n);
      const [{ n }] = await sql!`select count(*)::int as n from booking.payment_gateways where code = 'zibal'`;
      expect(n).toBe(1);
    });
  });

  describe("Zibal tokens per domain", () => {
    it("refuses a new domain without a token (validation, not a server error)", async () => {
      await expect(setZibal({ enabled: false, merchants: [{ host: "lsevin.ir", merchant: "" }] })).rejects.toBeInstanceOf(
        m.repo.PaymentGatewayValidationError
      );
    });

    it("stores tokens per domain, masks them on read, and keeps a token when the admin leaves it blank", async () => {
      await setZibal({
        enabled: false,
        merchants: [
          { host: "https://www.LsevinCare.com/", merchant: "zibal-token-com-1234" },
          { host: "lsevin.ir", merchant: "zibal-token-ir-5678" },
        ],
      });
      const masked = await m.repo.getPaymentGatewayConfig({ code: "zibal" });
      expect(masked?.settings.domainMerchants).toEqual([
        { host: "lsevin.ir", merchant: "ziba••••5678" },
        { host: "lsevincare.com", merchant: "ziba••••1234" },
      ]);

      // Blank keeps lsevin.ir's token, lsevincare.com is removed, appmain is added.
      await setZibal({
        enabled: false,
        merchants: [
          { host: "lsevin.ir", merchant: "" },
          { host: "appmain.lsevin.com", merchant: "zibal-token-app-9999" },
        ],
      });
      const stored = await m.repo.getPaymentGatewayConfig({ code: "zibal", includeSecrets: true });
      expect(stored?.settings.domainMerchants).toEqual([
        { host: "appmain.lsevin.com", merchant: "zibal-token-app-9999" },
        { host: "lsevin.ir", merchant: "zibal-token-ir-5678" },
      ]);

      // Saving another gateway, or Zibal without the list, never touches the tokens.
      const zarinpal = await m.repo.getPaymentGatewayConfig({ code: "zarinpal", includeSecrets: true });
      await m.repo.savePaymentGatewayConfig({ code: "zarinpal", displayName: zarinpal!.displayName, isEnabled: zarinpal!.isEnabled, settings: { ...zarinpal!.settings, merchantId: "" } });
      await setZibal({ enabled: false });
      const again = await m.repo.getPaymentGatewayConfig({ code: "zibal", includeSecrets: true });
      expect(again?.settings.domainMerchants).toHaveLength(2);
    });

    it("offers Zibal only on domains that have a token, ranked by sort order against Zarinpal", async () => {
      await sql!`update booking.payment_gateways set is_enabled = true, sort_order = 10 where code = 'zarinpal'`;
      await setZibal({ enabled: true, sortOrder: 5 });

      request.host = "lsevin.ir";
      expect((await m.repo.listEnabledPaymentGatewayOptions({ context: "wallet_topup" })).map((g) => g.code)).toContain("zibal");
      expect(await m.repo.resolveIranianCardGateway()).toBe("zibal");

      request.host = "lsevincare.com"; // no token any more
      const there = (await m.repo.listEnabledPaymentGatewayOptions({ context: "wallet_topup" })).map((g) => g.code);
      expect(there).not.toContain("zibal");
      expect(await m.repo.resolveIranianCardGateway()).toBe("zarinpal");

      // The admin puts Zarinpal first: it wins even where Zibal has a token.
      request.host = "lsevin.ir";
      await setZibal({ enabled: true, sortOrder: 50 });
      expect(await m.repo.resolveIranianCardGateway()).toBe("zarinpal");
    });

    it("with Zibal disabled, listing gateways never reads the request (pages render as before)", async () => {
      await setZibal({ enabled: false });
      request.headerReads = 0;
      const codes = (await m.repo.listEnabledPaymentGatewayOptions()).map((g) => g.code);
      expect(codes).not.toContain("zibal");
      expect(request.headerReads).toBe(0);
    });
  });

  describe("a Zibal wallet top-up, end to end", () => {
    it("is started with the domain's token, comes back to that domain, credits the wallet and posts to clearing_zibal", async () => {
      await setZibal({ enabled: true, sortOrder: 5 });
      request.host = "appmain.lsevin.com";

      const intentId = randomUUID();
      const started = await m.wallet.walletPaymentGateway.createTopUpIntent({
        intentId,
        userId,
        amount: 250_000,
        currencyCode: "IRR",
        paymentMethod: "card",
        gateway: "zibal",
        locale: "fa",
      });
      const trackId = Number(started.gatewayReference);
      const sent = zibal.payments.get(trackId)!;
      expect(sent.merchant).toBe("zibal-token-app-9999");
      expect(sent.callbackUrl).toBe("https://appmain.lsevin.com/fa/api/wallet/payments/zibal/callback");
      expect(sent.amount).toBe(250_000);

      const [wallet] = await sql!<{ id: string }[]>`
        insert into customer.wallet_accounts (user_id) values (${userId}) on conflict do nothing returning id::text`;
      const walletId = wallet?.id ?? (await sql!<{ id: string }[]>`select id::text from customer.wallet_accounts where user_id = ${userId}`)[0]!.id;
      await sql!`
        insert into customer.wallet_payment_intents (id, wallet_account_id, user_id, intent_type, payment_method, gateway_name, gateway_reference, currency_code, amount, status, metadata)
        values (${intentId}::uuid, ${walletId}::uuid, ${userId}::uuid, 'topup', 'card', 'zibal', ${String(trackId)}, 'IRR', 250000, 'requires_action', ${sql!.json(started.raw as never)})`;

      // A replayed callback on another domain verifies with that domain's token: Zibal refuses it.
      request.host = "lsevin.ir";
      const wrongDomain = await m.callback.verifyWalletTopUpPayment({ gateway: "zibal", authority: String(trackId), status: "OK" });
      expect(wrongDomain.status).toBe("failed");
      await sql!`update customer.wallet_payment_intents set status = 'requires_action' where id = ${intentId}::uuid`;

      request.host = "appmain.lsevin.com";
      const verified = await m.callback.verifyWalletTopUpPayment({ gateway: "zibal", authority: String(trackId), status: "OK" });
      expect(verified).toMatchObject({ status: "succeeded", referenceId: "4242" });

      const [credit] = await sql!<{ amount: string; status: string }[]>`
        select amount::text, status from customer.wallet_transactions where payment_intent_id = ${intentId}::uuid and transaction_type = 'topup'`;
      expect(credit).toMatchObject({ status: "completed" });
      expect(Number(credit!.amount)).toBe(250_000);

      const ledger = await sql!<{ system_key: string; direction: string }[]>`
        select a.system_key, case when l.debit_amount > 0 then 'debit' else 'credit' end as direction
        from accounting.journal_entries e
        join accounting.journal_lines l on l.entry_id = e.id
        join accounting.accounts a on a.id = l.account_id
        where e.idempotency_key = ${`deposit:zibal:${trackId}`}
        order by a.system_key`;
      expect(ledger).toEqual([
        { system_key: "clearing_zibal", direction: "debit" },
        { system_key: "user_wallet_liability", direction: "credit" },
      ]);

      // Refreshing the return page credits nothing twice.
      expect((await m.callback.verifyWalletTopUpPayment({ gateway: "zibal", authority: String(trackId), status: "OK" })).status).toBe("succeeded");
      const [{ n }] = await sql!`select count(*)::int as n from customer.wallet_transactions where payment_intent_id = ${intentId}::uuid`;
      expect(n).toBe(1);
    });

    it("a domain without a token cannot start a Zibal payment", async () => {
      request.host = "lsevincare.com";
      await expect(
        m.wallet.walletPaymentGateway.createTopUpIntent({ intentId: randomUUID(), userId, amount: 250_000, currencyCode: "IRR", paymentMethod: "card", gateway: "zibal" })
      ).rejects.toThrow(/no merchant token for lsevincare\.com/);
    });
  });

  describe("Enamad seals per domain", () => {
    const hostA = `a.${tag}.test`;
    const hostB = `b.${tag}.test`;
    const snippet = (id: string, code: string) =>
      `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=${id}&Code=${code}'><img src='https://trustseal.enamad.ir/logo.aspx?id=${id}&Code=${code}' code='${code}'></a>`;

    it("saves each domain's own seal from the pasted Enamad code", async () => {
      expect(await m.sealActions.saveDomainTrustSealAction({ host: `https://www.${hostA}/fa`, seal: snippet("111", "CodeForSiteA1") })).toEqual({ ok: true, host: hostA });
      expect(await m.sealActions.saveDomainTrustSealAction({ host: hostB, seal: "222 CodeForSiteB2" })).toEqual({ ok: true, host: hostB });
      const seals = await m.sealRepo.listDomainTrustSeals();
      expect(seals.find((s) => s.host === hostA)).toMatchObject({ enamadId: "111", enamadCode: "CodeForSiteA1" });
      expect(seals.find((s) => s.host === hostB)).toMatchObject({ enamadId: "222", enamadCode: "CodeForSiteB2" });
    });

    it("replaces a seal, removes it (soft) and can add it back", async () => {
      await m.sealActions.saveDomainTrustSealAction({ host: hostA, seal: snippet("333", "CodeForSiteA3") });
      expect((await m.sealRepo.listDomainTrustSeals()).find((s) => s.host === hostA)?.enamadId).toBe("333");

      expect(await m.sealActions.removeDomainTrustSealAction({ host: hostA })).toEqual({ ok: true, host: hostA });
      expect((await m.sealRepo.listDomainTrustSeals()).some((s) => s.host === hostA)).toBe(false);
      expect((await m.sealActions.removeDomainTrustSealAction({ host: hostA })).ok).toBe(false);

      await m.sealActions.saveDomainTrustSealAction({ host: hostA, seal: snippet("444", "CodeForSiteA4") });
      expect((await m.sealRepo.listDomainTrustSeals()).find((s) => s.host === hostA)?.enamadId).toBe("444");
    });

    it("rejects bad input and non-admins without writing anything", async () => {
      expect(await m.sealActions.saveDomainTrustSealAction({ host: "localhost", seal: "1 abcdefgh" })).toMatchObject({ ok: false, field: "host" });
      expect(await m.sealActions.saveDomainTrustSealAction({ host: hostB, seal: "<script>alert(1)</script>" })).toMatchObject({ ok: false, field: "seal" });
      admin.isAdmin = false;
      expect(await m.sealActions.saveDomainTrustSealAction({ host: hostB, seal: "999 CodeForSiteB9" })).toMatchObject({ ok: false, code: "FORBIDDEN" });
      expect(await m.sealActions.removeDomainTrustSealAction({ host: hostB })).toMatchObject({ ok: false, code: "FORBIDDEN" });
      expect((await m.sealRepo.listDomainTrustSeals()).find((s) => s.host === hostB)?.enamadId).toBe("222");
    });
  });
});
