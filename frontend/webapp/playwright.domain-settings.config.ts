import { defineConfig } from "@playwright/test";

/**
 * Per-domain Enamad seals and the Zibal gateway, on test domains site-a/site-b/site-c.localhost,
 * plus the seal checks of enamad-seal.spec.ts. Run through `pnpm test:local-env --suite domain-settings`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["domain-settings.spec.ts", "enamad-seal.spec.ts"],
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3140",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
