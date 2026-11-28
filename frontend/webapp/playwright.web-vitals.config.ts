import { defineConfig } from "@playwright/test";

// Mobile visitors pay only for the mobile page: e2e/web-vitals.spec.ts.
//   PERF_BASE_URL=http://127.0.0.1:3144 PERF_PROVIDER_SLUG=<slug> npx playwright test -c playwright.web-vitals.config.ts
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["web-vitals.spec.ts"],
  workers: 1,
  timeout: 120_000,
  retries: 1,
  outputDir: "./artifacts/web-vitals",
  use: { channel: "chrome", locale: "fa-IR" },
});
