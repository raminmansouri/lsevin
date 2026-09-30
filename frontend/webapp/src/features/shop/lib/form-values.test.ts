import { describe, expect, it } from "vitest";

import { parseFormBoolean } from "./form-values";

describe("parseFormBoolean", () => {
  it.each(["false", "0", "off", ""])("parses %j as false", (value) => {
    expect(parseFormBoolean(value)).toBe(false);
  });

  it.each(["true", "1", "on", " ON "])("parses %j as true", (value) => {
    expect(parseFormBoolean(value)).toBe(true);
  });
});
