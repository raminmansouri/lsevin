import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDisplayCurrencyAction } from "./currency.actions";

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  mode: vi.fn(),
  options: vi.fn(),
  event: vi.fn(),
  path: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.path }));
vi.mock("../lib/context", () => ({ setSelectedCurrencyCookie: mocks.cookie }));
vi.mock("../lib/pricing", () => ({
  getShopPricingMode: mocks.mode,
  getDisplayCurrencyOptions: mocks.options,
}));
vi.mock("../lib/analytics", () => ({ emitCommerceEvent: mocks.event }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.mode.mockResolvedValue("market_default_with_selector");
  mocks.options.mockResolvedValue([{ code: "IRR" }, { code: "EUR" }]);
});
describe("customer currency changes", () => {
  it("persists a validated choice and refreshes every localized shop route", async () => {
    await expect(
      setDisplayCurrencyAction({ currency: "eur" })
    ).resolves.toEqual({ ok: true, currency: "EUR" });
    expect(mocks.cookie).toHaveBeenCalledWith("EUR");
    expect(mocks.path).toHaveBeenCalledWith(
      "/[locale]/n/app/mobile/shop",
      "layout"
    );
  });
  it("does not persist choices disabled by the shop policy", async () => {
    mocks.mode.mockResolvedValue("market_default");
    expect((await setDisplayCurrencyAction({ currency: "EUR" })).ok).toBe(
      false
    );
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("does not persist unsupported currencies", async () => {
    expect((await setDisplayCurrencyAction({ currency: "USD" })).ok).toBe(
      false
    );
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("propagates infrastructure failures", async () => {
    mocks.mode.mockRejectedValue(new Error("database unavailable"));
    await expect(setDisplayCurrencyAction({ currency: "EUR" })).rejects.toThrow(
      "database unavailable"
    );
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
});
