import { defineConfig } from "@playwright/test";

/** Listing links by slug. See e2e/seo-filter-links.spec.ts for the env. */
const evidence = process.env.LINKS_REPORT_DIR || "artifacts/seo-filter-links";
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["seo-filter-links.spec.ts"],
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { outputFolder: `${evidence}-report`, open: "never" }]],
  outputDir: evidence,
  use: {
    baseURL: process.env.LINKS_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
