import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), value: 3 }));
vi.mock("@/config/database/db", () => ({
  default: Object.assign(mocks.query, { json: (x: unknown) => x }),
}));
beforeEach(() => {
  vi.resetModules();
  mocks.query.mockReset();
  mocks.value = 3;
  mocks.query.mockImplementation(
    async (parts: TemplateStringsArray, ...values: unknown[]) => {
      const statement = parts.join("?");
      if (statement.includes("select value"))
        return [{ value: String(mocks.value) }];
      if (statement.includes("value = excluded.value"))
        mocks.value = (values[1] as { value: number }).value;
      return [];
    }
  );
});
it("shares setup across concurrent reads without caching the price setting", async () => {
  const repo = await import(
    "@/features/finance/server/pricing-settings.repository"
  );
  expect(
    await Promise.all(
      Array.from({ length: 10 }, () => repo.getDefaultInternationalMultiplier())
    )
  ).toEqual(Array(10).fill(3));
  const statements = mocks.query.mock.calls.map(([parts]) => parts.join("?"));
  expect(statements.filter((x) => x.includes("create schema"))).toHaveLength(1);
  expect(statements.filter((x) => x.includes("create table"))).toHaveLength(1);
  expect(
    statements.filter((x) => x.includes("on conflict (key) do nothing"))
  ).toHaveLength(1);
  expect(statements.filter((x) => x.includes("select value"))).toHaveLength(10);
  await repo.updateDefaultInternationalMultiplier(5);
  expect(await repo.getDefaultInternationalMultiplier()).toBe(5);
});
it("does not retain failed initialization or misclassify database failures", async () => {
  const failure = new Error("database unavailable");
  mocks.query.mockRejectedValueOnce(failure);
  const repo = await import(
    "@/features/finance/server/pricing-settings.repository"
  );
  await expect(repo.getDefaultInternationalMultiplier()).rejects.toBe(failure);
  expect(await repo.getDefaultInternationalMultiplier()).toBe(3);
  expect(
    mocks.query.mock.calls.filter(([parts]) =>
      parts.join("?").includes("create schema")
    )
  ).toHaveLength(2);
});
it("rejects invalid admin values before any setup or write", async () => {
  const repo = await import(
    "@/features/finance/server/pricing-settings.repository"
  );
  for (const value of [0, -1, NaN, Infinity])
    await expect(
      repo.updateDefaultInternationalMultiplier(value)
    ).rejects.toThrow("positive number");
  expect(mocks.query).not.toHaveBeenCalled();
});
