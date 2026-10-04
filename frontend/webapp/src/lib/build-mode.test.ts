import { describe, expect, it } from "vitest";

import { getBuildMode, isFastBuild } from "./build-mode";

describe("build mode", () => {
  it("defaults to production", () => expect(getBuildMode(undefined)).toBe("production"));
  it("recognizes fast mode", () => expect(isFastBuild("fast")).toBe(true));
  it("rejects misspelled modes", () => expect(() => getBuildMode("fas")).toThrow(/Unsupported BUILD_MODE/));
});
