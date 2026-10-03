import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "shop.spec.ts",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.SHOP_E2E_BASE_URL || "http://localhost:3011",
    channel: "chrome",
    trace: "retain-on-failure",
  },
});
