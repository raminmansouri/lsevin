import { defineConfig } from "@playwright/test";

/** Signed-in account pages against a local server and database. See e2e/account/*.spec.ts for the env. */
export default defineConfig({
  testDir: "./e2e/account",
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  outputDir: "artifacts/account",
  use: {
    baseURL: process.env.HEALTH_E2E_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
