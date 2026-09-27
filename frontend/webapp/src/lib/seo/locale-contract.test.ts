import { describe, expect, it } from "vitest";

import { getDirection, isSupportedLocale, SUPPORTED_LOCALES } from "@/config/locales";
import { routing } from "@/i18n/routing";

describe("document locale contract", () => {
  it("uses the same supported locales as routing", () => {
    expect([...SUPPORTED_LOCALES].sort()).toEqual([...routing.locales].sort());
  });

  it.each(SUPPORTED_LOCALES)("validates and directs %s", (locale) => {
    expect(isSupportedLocale(locale)).toBe(true);
    expect(getDirection(locale)).toBe(["fa", "ar", "ku"].includes(locale) ? "rtl" : "ltr");
  });

  it.each(["", "FA", "en-US", "unknown", "../fa", "fa<script>"])("rejects unsupported input %s", (locale) => {
    expect(isSupportedLocale(locale)).toBe(false);
  });
});
