import { defineConfig } from "@playwright/test";

/** Public site chrome (Enamad seal on desktop footer and mobile home). See e2e/enamad-seal.spec.ts. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["enamad-seal.spec.ts"],
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3140",
    channel: "chrome",
    trace: "retain-on-failure",
  },
});
