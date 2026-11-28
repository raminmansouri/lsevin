import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/config/database/db", () => ({ default: vi.fn() }));

import { normalizeServiceName, sameServiceName } from "./duplicate-service-name";

describe("duplicate service names", () => {
  it("ignores case, spacing and unicode form", () => {
    expect(normalizeServiceName("  Breast   Lift ")).toBe("breast lift");
  });

  it("matches the same name in a shared locale", () => {
    expect(sameServiceName({ "fa-IR": "ماموپلاستی" }, { "fa-IR": " ماموپلاستی ", "en-US": "x" })).toBe(true);
    expect(sameServiceName({ "en-US": "Mammoplasty" }, { "en-US": "mammoplasty" })).toBe(true);
  });

  it("keeps differently named services apart", () => {
    expect(sameServiceName({ "fa-IR": "ماموپلاستی" }, { "fa-IR": "ماموپلاستی ترمیمی" })).toBe(false);
    expect(sameServiceName({ "en-US": "" }, { "en-US": "" })).toBe(false);
    expect(sameServiceName({ "fa-IR": "a" }, { "en-US": "a" })).toBe(false);
  });
});
