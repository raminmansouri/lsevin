import { defineConfig } from "@playwright/test";

/** Visitor language, prices and location. See e2e/market-locale.spec.ts for the env. */
const evidence = process.env.MARKET_REPORT_DIR || "artifacts/market-locale";
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["market-locale.spec.ts"],
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { outputFolder: `${evidence}-report`, open: "never" }]],
  outputDir: evidence,
  use: {
    baseURL: process.env.MARKET_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
