import { defineConfig, devices } from "@playwright/test";

/** Phone-width layout checks (read-only). See e2e/layout/no-horizontal-overflow.spec.ts. */
export default defineConfig({
  testDir: "./e2e/layout",
  workers: 2,
  retries: 1,
  timeout: 120_000,
  reporter: [["list"]],
  outputDir: "artifacts/layout",
  use: {
    ...devices["Pixel 7"],
    baseURL: process.env.LAYOUT_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    screenshot: "only-on-failure",
  },
});
