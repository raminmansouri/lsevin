import { defineConfig, devices } from "@playwright/test";

/**
 * Stays (hotels / اقامتگاه) acceptance suite — e2e/stays.
 *
 *   node scripts/migrate.mjs                          # DATABASE_URL = the e2e database
 *   npx playwright test --config playwright.stays.config.ts
 *
 * Reuses the tours E2E support (real database client, signed NextAuth session,
 * wallet funding through the accounting bridge), pointed at the stays database:
 *   STAYS_E2E_DATABASE_URL  default postgres://lsevin:lsevin@127.0.0.1:55432/lsevin_stays_e2e
 *   STAYS_E2E_BASE_URL      a running app (e.g. `next start` of a production build);
 *                           when unset Playwright starts `next dev` on STAYS_E2E_PORT (3045)
 * Tests seed their own uniquely named data, so the suite can be re-run on one database.
 * Tags: @critical (release-blocking journeys), @regression, @smoke (read-only, safe in production).
 */
process.env.TOURS_E2E_DATABASE_URL = process.env.STAYS_E2E_DATABASE_URL || process.env.TOURS_E2E_DATABASE_URL || "postgres://lsevin:lsevin@127.0.0.1:55432/lsevin_stays_e2e";
const PORT = Number(process.env.STAYS_E2E_PORT || 3045);
process.env.TOURS_E2E_PORT = String(PORT);
if (process.env.STAYS_E2E_BASE_URL) process.env.TOURS_E2E_BASE_URL = process.env.STAYS_E2E_BASE_URL;
const BASE_URL = process.env.TOURS_E2E_BASE_URL || `http://localhost:${PORT}`;
process.env.TOURS_E2E_BASE_URL = BASE_URL;
const DB = process.env.TOURS_E2E_DATABASE_URL;

export default defineConfig({
  testDir: "./e2e/stays",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 150_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/stays", open: "never" }],
    ["junit", { outputFile: "test-results/stays-junit.xml" }],
    ["json", { outputFile: "test-results/stays-results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // The PWA service worker ships `connect-src 'self'` locally (Caddy overrides it in production);
    // blocking it keeps local runs equal to what users get.
    serviceWorkers: "block",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" }, testIgnore: /(admin|seo).*\.spec\.ts$/ },
    { name: "desktop", use: { viewport: { width: 1366, height: 900 }, channel: "chrome" }, testMatch: /(admin|desktop|seo).*\.spec\.ts$/ },
  ],
  webServer: process.env.STAYS_E2E_BASE_URL
    ? undefined
    : {
        command: `npx next dev --port ${PORT}`,
        url: `http://localhost:${PORT}/api/health`,
        timeout: 300_000,
        reuseExistingServer: true,
        env: { DATABASE_URL: DB, DATABASE_URL_DIRECT: DB, POSTGRES_PREPARE: "false", AUTH_URL: `http://localhost:${PORT}`, NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
      },
});
