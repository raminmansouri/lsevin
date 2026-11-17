import { defineConfig } from "@playwright/test";

/** Admin access control. Run through `pnpm test:local-env --suite admin-access` (see e2e/admin-access-control.spec.ts). */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["admin-access-control.spec.ts"],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // A dev server compiles each admin page on first request (minutes on a slow disk); a built
  // server in CI finishes these tests in seconds. Budget for the slow case.
  timeout: 600_000,
  expect: { timeout: 45_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/admin-access" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3140",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
