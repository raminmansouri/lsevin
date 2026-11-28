import { defineConfig, devices } from "@playwright/test";

/**
 * Unified search acceptance suite: e2e/search.
 *
 *   SEARCH_E2E_BASE_URL       a running app, e.g. http://127.0.0.2:3055 (`next dev --webpack` / `next start`)
 *   SEARCH_E2E_DATABASE_URL   the database that app uses (must end in "_it"; the suite loads its own fixtures)
 *   EMBEDDING_URL             the embedding service (default http://127.0.0.1:8089)
 *   SEARCH_E2E_CHANNEL=chrome use the installed Chrome instead of the bundled Chromium
 *   SEARCH_E2E_HARNESS=1      the base URL serves only the search page (no app shell): skips the noindex check
 *
 * Tags: @critical (release-blocking), @regression.
 */
const BASE_URL = process.env.SEARCH_E2E_BASE_URL || "http://127.0.0.2:3055";
const channel = process.env.SEARCH_E2E_CHANNEL || undefined;

export default defineConfig({
  testDir: "./e2e/search",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: { baseURL: BASE_URL, trace: "retain-on-failure", screenshot: "only-on-failure", channel },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "phone-360", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 }, channel }, grep: /@mobile/ },
  ],
});
