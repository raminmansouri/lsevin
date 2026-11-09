import { defineConfig } from "@playwright/test";

/** Per-route translation sets (SEO tracker T37). See e2e/route-messages.spec.ts for the env. */
const evidence = process.env.ROUTE_MESSAGES_REPORT_DIR || "artifacts/route-messages";
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["route-messages.spec.ts"],
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { outputFolder: `${evidence}-report`, open: "never" }]],
  outputDir: evidence,
  use: {
    baseURL: process.env.ROUTE_MESSAGES_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
