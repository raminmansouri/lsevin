import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "pwa-app.spec.ts",
  workers: 1,
  timeout: 120000,
  expect: { timeout: 30000 },
  outputDir: "test-results/pwa-app",
  use: {
    ...devices["Pixel 7"],
    channel: "chrome",
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3188",
    serviceWorkers: "allow",
    proxy: process.env.PWA_E2E_PROXY
      ? { server: process.env.PWA_E2E_PROXY }
      : undefined,
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "node scripts/pwa-runtime.mjs",
        url: "http://localhost:3188/offline.html",
        reuseExistingServer: false,
        timeout: 180000,
      },
});
