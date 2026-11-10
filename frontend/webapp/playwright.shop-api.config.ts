import { defineConfig } from "@playwright/test";

/** Shop API tokens, client API and review flow. Run through `pnpm test:local-env --suite shop-api`. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["shop-api.spec.ts"],
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3140",
    channel: "chrome",
    trace: "retain-on-failure",
  },
});
