import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createChildAccount,
  setAccountActive,
  AccountValidationError,
} from "./accounts-admin";
import { SettingsValidationError, updateSetting } from "./settings-admin";
import { closeTestSql, ensureAccountingSchema, testSql } from "./__testing__/harness";

const ADMIN = "00000000-0000-0000-0000-0000000000aa";

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await closeTestSql();
});

describe("settings editing", () => {
  it("saves a percentage and records who changed it", async () => {
    await updateSetting({
      key: "platform_fee_percent",
      kind: "percent",
      value: "7.5",
      actorUserId: ADMIN,
    });

    const [row] = await testSql<{ value: unknown; updated_by: string }[]>`
      select value, updated_by::text as updated_by
      from accounting.settings where key = 'platform_fee_percent'
    `;
    expect(Number(row.value)).toBe(7.5);
    expect(row.updated_by).toBe(ADMIN);

    const [audit] = await testSql<{ action: string; before_state: any; after_state: any }[]>`
      select action, before_state, after_state
      from accounting.audit_log
      where entity_key = 'platform_fee_percent'
      order by id desc limit 1
    `;
    expect(audit.action).toBe("settings.update");
    expect(Number(audit.after_state.value)).toBe(7.5);

    await updateSetting({ key: "platform_fee_percent", kind: "percent", value: "5", actorUserId: ADMIN });
  });

  it("refuses a percentage above 100", async () => {
    await expect(
      updateSetting({ key: "platform_fee_percent", kind: "percent", value: "500", actorUserId: ADMIN })
    ).rejects.toThrow(/cannot be greater than 100/i);

    const [row] = await testSql<{ value: unknown }[]>`
      select value from accounting.settings where key = 'platform_fee_percent'
    `;
    expect(Number(row.value)).toBe(5);
  });

  it("refuses a non-numeric amount instead of storing it", async () => {
    await expect(
      updateSetting({
        key: "withdrawal.min_amount",
        kind: "per_currency_amount",
        entries: { IRR: "۱۰۰۰۰۰۰" }, // Persian digits are not a number to Postgres
        actorUserId: ADMIN,
      })
    ).rejects.toThrow(SettingsValidationError);
  });

  it("keeps amounts as strings so precision survives", async () => {
    await updateSetting({
      key: "withdrawal.min_amount",
      kind: "per_currency_amount",
      entries: { IRR: "1000000.123456789012345678" },
      actorUserId: ADMIN,
    });

    const [row] = await testSql<{ irr: string }[]>`
      select value ->> 'IRR' as irr from accounting.settings where key = 'withdrawal.min_amount'
    `;
    // Round-tripped through JSON as text, not as a double.
    expect(row.irr).toBe("1000000.123456789012345678");

    await updateSetting({
      key: "withdrawal.min_amount",
      kind: "per_currency_amount",
      entries: { IRR: "1000000" },
      actorUserId: ADMIN,
    });
  });

  it("refuses to change the base currency", async () => {
    await expect(
      updateSetting({ key: "base_currency", kind: "readonly", value: "USD", actorUserId: ADMIN })
    ).rejects.toThrow(/cannot be changed/i);
  });

  it("validates a rate limit rather than storing nonsense", async () => {
    await expect(
      updateSetting({
        key: "rate_limit.withdrawal",
        kind: "rate_limit",
        limit: "5",
        windowSeconds: "0",
        actorUserId: ADMIN,
      })
    ).rejects.toThrow(/positive window/i);
  });
});

describe("chart of accounts editing", () => {
  it("refuses a sub-account code that is not 1 to 4 digits", async () => {
    const [parent] = await testSql<{ id: string }[]>`
      select id::text as id from accounting.accounts where code = '11001' limit 1
    `;
    await expect(
      createChildAccount({
        parentId: parent.id,
        segment: "99999",
        nameFa: "تست",
        nameEn: "test",
        actorUserId: ADMIN,
      })
    ).rejects.toThrow(/۱ تا ۴ رقم/);
  });

  it("creates a child under its parent's code that inherits its type and normal side", async () => {
    const [parent] = await testSql<{ id: string }[]>`
      select id::text as id from accounting.accounts where code = '11001' limit 1
    `;
    const created = await createChildAccount({
      parentId: parent.id,
      segment: "90",
      nameFa: "حساب آزمایشی",
      nameEn: "Test account",
      actorUserId: ADMIN,
    });

    try {
      const [account] = await testSql<
        { code: string; account_type: string; normal_balance: string; level: number; is_postable: boolean }[]
      >`
        select code, account_type, normal_balance, level, is_postable
        from accounting.accounts where id = ${created.id}
      `;
      expect(account.code).toBe("1100190");
      expect(account.account_type).toBe("asset");
      expect(account.normal_balance).toBe("debit");
      expect(account.level).toBe(4);
      expect(account.is_postable).toBe(true);
    } finally {
      await testSql`delete from accounting.accounts where id = ${created.id}`;
    }
  });

  it("refuses to deactivate a system account the posting rules depend on", async () => {
    const [account] = await testSql<{ id: string }[]>`
      select id::text as id from accounting.accounts where system_key = 'user_wallet_liability'
    `;
    await expect(
      setAccountActive({ accountId: account.id, isActive: false, actorUserId: ADMIN })
    ).rejects.toThrow(AccountValidationError);

    const [after] = await testSql<{ is_active: boolean }[]>`
      select is_active from accounting.accounts where id = ${account.id}
    `;
    expect(after.is_active).toBe(true);
  });
});
