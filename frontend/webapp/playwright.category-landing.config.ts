import { defineConfig } from "@playwright/test";

/** Landing-page category priority. Run through `pnpm test:local-env` (see e2e/category-landing.spec.ts). */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["category-landing.spec.ts"],
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3140",
    channel: "chrome",
    trace: "retain-on-failure",
  },
});
