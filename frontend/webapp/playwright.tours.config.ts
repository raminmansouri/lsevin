import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL, E2E_DB_URL, E2E_INTERNAL_KEY, E2E_PORT } from "./e2e/tours/support/env";

/**
 * Tours acceptance suite (docs/designs/tours/Tours.md, AT-01..AT-48).
 *
 *   node scripts/tours-e2e-db.mjs            # once: migrate the local e2e database
 *   npx playwright test --config playwright.tours.config.ts
 *
 * Starts `next dev` on TOURS_E2E_PORT (3031) against TOURS_E2E_DATABASE_URL unless
 * TOURS_E2E_BASE_URL points at a running app. Tests seed their own uniquely named
 * data, so the suite can be re-run against the same database.
 */
export default defineConfig({
  testDir: "./e2e/tours",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report/tours", open: "never" }]],
  use: {
    baseURL: E2E_BASE_URL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "desktop", use: { viewport: { width: 1366, height: 900 }, channel: "chrome" }, testMatch: /(admin|desktop|responsive).*\.spec\.ts$/ },
  ],
  webServer: process.env.TOURS_E2E_BASE_URL
    ? undefined
    : {
        command: `npx next dev --port ${E2E_PORT}`,
        url: `http://localhost:${E2E_PORT}/api/health`,
        timeout: 300_000,
        reuseExistingServer: true,
        env: {
          DATABASE_URL: E2E_DB_URL,
          DATABASE_URL_DIRECT: E2E_DB_URL,
          POSTGRES_PREPARE: "false",
          TOURS_INTERNAL_API_KEY: E2E_INTERNAL_KEY,
          TOURS_WEATHER_PROVIDER: process.env.TOURS_WEATHER_PROVIDER || "fixture",
          AUTH_URL: `http://localhost:${E2E_PORT}`,
          NEXT_PUBLIC_APP_URL: `http://localhost:${E2E_PORT}`,
        },
      },
});
