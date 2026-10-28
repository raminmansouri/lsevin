import { defineConfig } from "@playwright/test";

const evidence = process.env.SEO_E2E_REPORT_DIR || "artifacts/public-seo";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "public-seo.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: `${evidence}-report`, open: "never" }],
    ["json", { outputFile: `${evidence}-results.json` }],
  ],
  outputDir: evidence,
  use: {
    baseURL: process.env.SEO_E2E_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
